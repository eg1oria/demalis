import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';
import { reportError } from './alerts';

/**
 * Все ошибки отвечают как обычно (BaseExceptionFilter), а непойманные и 5xx
 * ещё и уходят админу в Telegram. 4xx — нормальная работа, их не шлём.
 */
@Catch()
export class AlertingExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
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
