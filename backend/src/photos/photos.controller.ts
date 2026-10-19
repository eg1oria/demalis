import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { PhotosService } from './photos.service';

@Controller()
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post('admin/photos/upload-url')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  uploadUrl(@Body() body: { contentType?: string }) {
    return this.photos.createUpload(String(body.contentType ?? ''));
  }

  /** Сам файл: тело запроса — картинка (express.raw в main.ts). */
  @Put('uploads/places/:file')
  @HttpCode(201)
  async upload(
    @Param('file') file: string,
    @Query('token') token: string | undefined,
    @Headers('content-type') contentType: string | undefined,
    @Req() req: Request,
  ) {
    const path = `places/${file}`;
    const error = await this.photos.save(path, token, contentType, req.body);
    if (error) throw new BadRequestException({ error });
    return { path };
  }
}
