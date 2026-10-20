import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { clientIp } from '../common/client-ip';
import { isUuid } from '../common/uuid';
import { isIsoDate } from '../shared/dates';
import { FormsService } from './forms.service';
import { parseCatalogQuery, PublicService } from './public.service';

const EVENT_TYPES = new Set([
  'view',
  'whatsapp_click',
  'phone_click',
  'instagram_click',
]);

function isoDateParam(value: string | undefined, name: string): string {
  if (!isIsoDate(value))
    throw new BadRequestException({ error: `${name}: нужна дата YYYY-MM-DD` });
  return value;
}

function found<T>(value: T | null): T {
  if (value === null) throw new NotFoundException({ error: 'Не найдено' });
  return value;
}

/** API для публичных страниц сайта. */
@Controller('public')
export class PublicController {
  constructor(
    private readonly data: PublicService,
    private readonly forms: FormsService,
  ) {}

  @Get('places')
  places(@Query() query: Record<string, string | undefined>) {
    return this.data.findPlaces(parseCatalogQuery(query));
  }

  @Get('places/by-ids')
  placesByIds(@Query('ids') ids = '') {
    const list = ids.split(',').filter(isUuid).slice(0, 200);
    return list.length ? this.data.findPlacesByIds(list) : [];
  }

  @Get('places/by-slug/:slug')
  async placeBySlug(@Param('slug') slug: string) {
    return found(await this.data.placeBySlug(slug));
  }

  @Get('places/:id')
  async placeById(@Param('id') id: string) {
    return found(isUuid(id) ? await this.data.placeById(id) : null);
  }

  @Get('places/:id/similar')
  async similar(@Param('id') id: string) {
    return found(isUuid(id) ? await this.data.similar(id) : null);
  }

  @Get('places/:id/availability')
  availability(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!isUuid(id)) throw new NotFoundException({ error: 'Не найдено' });
    return this.data.placeAvailability(
      id,
      isoDateParam(from, 'from'),
      isoDateParam(to, 'to'),
    );
  }

  /** Ночи from..to включительно (не больше 31). */
  @Get('availability/nights')
  nights(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('place') place?: string,
  ) {
    const start = isoDateParam(from, 'from');
    const end = isoDateParam(to, 'to');
    const days = (Date.parse(end) - Date.parse(start)) / 864e5;
    if (!(days >= 0 && days <= 31))
      throw new BadRequestException({ error: 'Диапазон — до 31 ночи' });
    if (place !== undefined && !isUuid(place))
      throw new BadRequestException({ error: 'place: нужен uuid' });
    return this.data.nights(start, end, place);
  }

  @Get('availability/night/:date')
  night(@Param('date') date: string) {
    return this.data.night(isoDateParam(date, 'date'));
  }

  @Get('sitemap')
  sitemap() {
    return this.data.sitemap();
  }

  @Get('collections')
  collections() {
    return this.data.collections();
  }

  @Get('collections/:slug')
  async collection(@Param('slug') slug: string) {
    return found(await this.data.collection(slug));
  }

  /** Просмотр или клик (без IP и персональных данных). */
  @Post('events')
  @HttpCode(204)
  async event(@Body() body: { placeId?: string; type?: string }) {
    if (!isUuid(body.placeId) || !EVENT_TYPES.has(body.type ?? ''))
      throw new BadRequestException({ error: 'Неверное событие' });
    if (!(await this.data.recordEvent(body.placeId, body.type!)))
      throw new NotFoundException({ error: 'Не найдено' });
  }

  @Post('leads')
  @HttpCode(200)
  lead(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.forms.submitLead(body, clientIp(req));
  }

  @Post('group-requests')
  @HttpCode(200)
  groupRequest(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.forms.submitGroupRequest(body, clientIp(req));
  }

  @Get('reviews/:token')
  async review(@Param('token') token: string) {
    return found(await this.data.reviewByToken(token));
  }

  @Post('reviews/:token')
  @HttpCode(200)
  submitReview(
    @Param('token') token: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.forms.submitReview(token, body, clientIp(req));
  }

  @Post('owner-requests')
  @HttpCode(200)
  ownerRequest(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.forms.submitOwnerRequest(body, clientIp(req));
  }
}
