import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { parseMonth } from '../shared/dates';
import type { RawPlaceInput } from '../shared/places/validate';
import { AdminService } from './admin.service';
import { AdminPlacesService } from './places.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const uuid = new ParseUUIDPipe({
  exceptionFactory: () => new NotFoundException({ error: 'Не найдено' }),
});

function isoDateParam(value: string | undefined, name: string): string {
  if (!value || !ISO_DATE.test(value))
    throw new BadRequestException({ error: `${name}: нужна дата YYYY-MM-DD` });
  return value;
}

function rawPlace(fields: unknown): RawPlaceInput {
  const raw: RawPlaceInput = {};
  if (fields && typeof fields === 'object')
    for (const [key, value] of Object.entries(fields))
      if (typeof value === 'string') raw[key] = value;
  return raw;
}

/** API админки. Всё — только с токеном админа. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly places: AdminPlacesService,
  ) {}

  // ── Объекты ─────────────────────────────────────────────────────────────

  @Get('places')
  listPlaces(@Query('status') status?: string, @Query('q') q?: string) {
    return this.places.list(status, q);
  }

  @Post('places')
  @HttpCode(200)
  createPlace(@Body() body: { fields?: unknown; photos?: unknown }) {
    return this.places.save(null, rawPlace(body.fields), body.photos ?? []);
  }

  @Post('places/import')
  @HttpCode(200)
  importPlaces(@Body() body: { rows?: { line: number; raw: unknown }[] }) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length > 1000)
      throw new BadRequestException({ error: 'Не больше 1000 строк за раз' });
    return this.places.import(
      rows.map((r) => ({ line: Number(r.line), raw: rawPlace(r.raw) })),
    );
  }

  @Get('places/:id')
  getPlace(@Param('id', uuid) id: string) {
    return this.places.get(id);
  }

  @Patch('places/:id')
  updatePlace(
    @Param('id', uuid) id: string,
    @Body() body: { fields?: unknown; photos?: unknown },
  ) {
    return this.places.save(id, rawPlace(body.fields), body.photos ?? []);
  }

  @Get('places/:id/availability')
  availability(
    @Param('id', uuid) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.places.availability(
      id,
      isoDateParam(from, 'from'),
      isoDateParam(to, 'to'),
    );
  }

  @Put('places/:id/availability/:date')
  setAvailability(
    @Param('id', uuid) id: string,
    @Param('date') date: string,
    @Body() body: { status?: unknown },
  ) {
    return this.places.setAvailability(id, date, body.status ?? null);
  }

  @Get('places/:id/payments')
  payments(@Param('id', uuid) id: string) {
    return this.admin.payments(id);
  }

  @Post('places/:id/payments')
  @HttpCode(200)
  addPayment(
    @Param('id', uuid) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.addPayment(id, body);
  }

  @Delete('places/:id/payments/:paymentId')
  @HttpCode(204)
  deletePayment(
    @Param('id', uuid) id: string,
    @Param('paymentId', uuid) paymentId: string,
  ) {
    return this.admin.deletePayment(id, paymentId);
  }

  // ── Владельцы ───────────────────────────────────────────────────────────

  @Get('owners')
  owners() {
    return this.admin.owners();
  }

  @Post('owners')
  @HttpCode(200)
  createOwner(@Body() body: { name?: unknown; phone?: unknown }) {
    return this.admin.saveOwner(null, body);
  }

  @Get('owners/:id')
  owner(@Param('id', uuid) id: string) {
    return this.admin.owner(id);
  }

  @Patch('owners/:id')
  updateOwner(
    @Param('id', uuid) id: string,
    @Body() body: { name?: unknown; phone?: unknown },
  ) {
    return this.admin.saveOwner(id, body);
  }

  @Post('owners/:id/link-code')
  @HttpCode(204)
  linkCode(@Param('id', uuid) id: string) {
    return this.admin.createLinkCode(id);
  }

  @Delete('owners/:id/telegram')
  @HttpCode(204)
  unlink(@Param('id', uuid) id: string) {
    return this.admin.unlinkTelegram(id);
  }

  @Get('owners/:id/report')
  report(@Param('id', uuid) id: string, @Query('month') month?: string) {
    return this.admin.ownerReport(id, parseMonth(month, new Date()));
  }

  @Post('owners/:id/report')
  @HttpCode(200)
  sendReport(@Param('id', uuid) id: string, @Body() body: { month?: string }) {
    return this.admin.sendOwnerReport(id, parseMonth(body.month, new Date()));
  }

  // ── Праздники ───────────────────────────────────────────────────────────

  @Get('holidays')
  holidays(@Query('night') night?: string) {
    return this.admin.holidays(isoDateParam(night, 'night'));
  }

  @Put('holidays/:placeId')
  setHoliday(
    @Param('placeId', uuid) placeId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.setHoliday(placeId, body);
  }

  @Post('holidays/survey')
  @HttpCode(200)
  holidaySurvey(@Body() body: { night?: unknown }) {
    return this.admin.sendHolidaySurvey(body.night);
  }

  // ── Заявки ──────────────────────────────────────────────────────────────

  @Get('leads')
  leads(@Query('status') status?: string, @Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit) || 200, 1), 1000);
    return this.admin.leads(status, take);
  }

  @Patch('leads/:id')
  updateLead(
    @Param('id', uuid) id: string,
    @Body() body: { status?: unknown; billable?: unknown },
  ) {
    return this.admin.updateLead(id, body);
  }

  // ── Подборки ────────────────────────────────────────────────────────────

  @Get('collections')
  collections() {
    return this.admin.collections();
  }

  @Post('collections')
  @HttpCode(200)
  createCollection(@Body() body: Record<string, unknown>) {
    return this.admin.saveCollection(null, body);
  }

  @Get('collections/:id')
  collection(@Param('id', uuid) id: string) {
    return this.admin.collection(id);
  }

  @Patch('collections/:id')
  updateCollection(
    @Param('id', uuid) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.saveCollection(id, body);
  }

  // ── Статистика и отчёт ──────────────────────────────────────────────────

  @Get('stats')
  stats(@Query('month') month?: string) {
    return month
      ? this.admin.monthStats(parseMonth(month, new Date()))
      : this.admin.stats();
  }

  @Get('billing')
  billing(@Query('month') month?: string) {
    return this.admin.billing(parseMonth(month, new Date()));
  }
}
