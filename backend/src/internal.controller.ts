import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { reportError } from './common/alerts';
import { fromFrontendServer } from './common/client-ip';

type FrontendError = {
  message?: unknown;
  digest?: unknown;
  stack?: unknown;
  path?: unknown;
  route?: unknown;
};

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.slice(0, max) : '';

/** Служебные запросы от сервера Next.js (только с INTERNAL_API_SECRET). */
@Controller('internal')
export class InternalController {
  /** Ошибка на сервере сайта (instrumentation.ts → onRequestError) → админу в Telegram. */
  @Post('errors')
  @HttpCode(204)
  async error(@Req() req: Request, @Body() body: FrontendError) {
    if (!fromFrontendServer(req))
      throw new UnauthorizedException({ error: 'Unauthorized' });
    const error = new Error(text(body.message, 500) || 'без описания');
    const digest = text(body.digest, 100);
    error.stack = [
      `${error.message}${digest ? ` (digest ${digest})` : ''}`,
      text(body.stack, 2500),
    ]
      .filter(Boolean)
      .join('\n');
    await reportError(
      `сайт: ${text(body.path, 200) || '?'} ${text(body.route, 200)}`.trim(),
      error,
    );
  }
}
