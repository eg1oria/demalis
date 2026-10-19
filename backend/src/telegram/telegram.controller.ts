import { Controller, HttpCode, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { webhookCallback } from 'grammy';
import { createBot } from '../bot/bot';
import { botToken } from './api';

type Handler = (req: Request, res: Response) => Promise<void>;

/**
 * Webhook бота. Telegram присылает секрет в заголовке
 * X-Telegram-Bot-Api-Secret-Token — без него grammY отвечает 401.
 */
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private handler: Handler | null = null;

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const token = botToken();
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!token || !secret) {
      res.status(503).send('Бот не настроен');
      return;
    }
    this.handler ??= webhookCallback(createBot(token), 'express', {
      secretToken: secret,
    }) as unknown as Handler;
    try {
      await this.handler(req, res);
    } catch (e) {
      // Отвечаем 200: иначе Telegram будет бесконечно присылать то же сообщение.
      this.logger.error('telegram webhook', e);
      if (!res.headersSent) res.status(200).end();
    }
  }
}
