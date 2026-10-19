import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaClient) {}

  /** Бэкенд жив и видит базу. */
  @Get()
  async health() {
    await this.prisma.$queryRaw`select 1`;
    return { ok: true };
  }
}
