import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { runDailyJobs } from '../bot/daily';
import { reportError } from '../common/alerts';

/** Сколько сообщений владельцам не ушло (например, бот заблокирован). */
export function dailyFailures(
  result: Awaited<ReturnType<typeof runDailyJobs>>,
): number {
  return (
    result.proReminders.failed +
    (result.weekly?.failed ?? 0) +
    (result.monthly?.failed ?? 0)
  );
}

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
      const result = await runDailyJobs();
      this.logger.log(JSON.stringify(result));
      const failed = dailyFailures(result);
      if (failed > 0)
        await reportError(
          'ежедневные задачи',
          `не доставлено сообщений владельцам: ${failed} (подробности — в логах бэкенда)`,
        );
    } catch (e) {
      await reportError('ежедневные задачи', e);
    }
  }
}
