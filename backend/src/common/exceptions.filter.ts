import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client';
import { reportError } from './alerts';

/** update/delete по несуществующему id (P2025) — это 404, а не сбой сервера. */
export function normalizeException(exception: unknown): unknown {
  return exception instanceof Prisma.PrismaClientKnownRequestError &&
    exception.code === 'P2025'
    ? new NotFoundException({ error: 'Не найдено' })
    : exception;
}

/**
 * Все ошибки отвечают как обычно (BaseExceptionFilter), а непойманные и 5xx
 * ещё и уходят админу в Telegram. 4xx — нормальная работа, их не шлём.
 */
@Catch()
export class AlertingExceptionFilter extends BaseExceptionFilter {
  catch(raw: unknown, host: ArgumentsHost) {
    const exception = normalizeException(raw);
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500 && host.getType() === 'http') {
      const req = host.switchToHttp().getRequest<Request>();
      // Только путь: в строке запроса бывают токены (загрузка фото).
      void reportError(`${req.method} ${req.path}`, exception);
    }
    super.catch(exception, host);
  }
}
