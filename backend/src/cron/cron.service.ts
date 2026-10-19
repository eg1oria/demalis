import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { runDailyJobs } from '../bot/daily';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  /**
   * Ежедневно в 12:00 по Алматы (07:00 UTC): истёкший Pro → free, напоминание
   * о конце Pro, по четвергам — «обновите занятость», 1–3-го — отчёт за месяц.
   * Выключить (например, для второго экземпляра): CRON_ENABLED=false.
   */
  @Cron('0 7 * * *', {
    timeZone: 'UTC',
    disabled: process.env.CRON_ENABLED === 'false',
  })
  async daily() {
    try {
      this.logger.log(JSON.stringify(await runDailyJobs()));
    } catch (e) {
      this.logger.error('daily jobs', e);
    }
  }
}
