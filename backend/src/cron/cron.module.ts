import { Module } from '@nestjs/common';
import { TelegramController } from '../telegram/telegram.controller';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';

/** Бот и расписание: webhook Telegram, ежедневные задачи. */
@Module({
  controllers: [TelegramController, CronController],
  providers: [CronService],
})
export class BotModule {}
