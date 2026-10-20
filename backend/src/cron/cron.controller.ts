import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { runDailyJobs } from '../bot/daily';
import { sameSecret } from '../common/client-ip';

/** Ручной запуск ежедневных задач: Authorization: Bearer <CRON_SECRET>. */
@Controller('cron')
export class CronController {
  @Post('daily')
  async daily(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret || !sameSecret(authorization ?? '', `Bearer ${secret}`))
      throw new UnauthorizedException({ error: 'Unauthorized' });
    return runDailyJobs();
  }
}
