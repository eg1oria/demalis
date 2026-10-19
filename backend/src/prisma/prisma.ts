import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

let client: PrismaClient | null = null;

/**
 * Единый клиент базы на процесс. В сервисах Nest его получают через DI
 * (PrismaClient из PrismaModule), в функциях бота — через db().
 */
export function db(): PrismaClient {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
      throw new Error('Не задан DATABASE_URL — см. backend/.env.example');
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return client;
}

export async function disconnectDb() {
  if (client) await client.$disconnect();
  client = null;
}
