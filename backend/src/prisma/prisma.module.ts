import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { db, disconnectDb } from './prisma';

@Global()
@Module({
  providers: [{ provide: PrismaClient, useFactory: db }],
  exports: [PrismaClient],
})
export class PrismaModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await disconnectDb();
  }
}
