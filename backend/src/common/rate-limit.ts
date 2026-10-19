import type { PrismaClient } from '../generated/prisma/client';

/**
 * Лимит форм: не больше limit попыток с одного ключа за окно.
 * true — попытка засчитана, false — лимит исчерпан.
 * Записи старше окна удаляются при каждом вызове.
 */
export function hitRateLimit(
  prisma: PrismaClient,
  key: string,
  limit: number,
  window: string,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // Две заявки одновременно с одного IP не должны обе пройти проверку.
    await tx.$executeRaw`select pg_advisory_xact_lock(hashtext(${'lead_rate_limit:' + key}))`;
    await tx.$executeRaw`delete from lead_rate_limits where created_at < now() - ${window}::interval`;
    const used = await tx.leadRateLimit.count({ where: { key } });
    if (used >= limit) return false;
    await tx.leadRateLimit.create({ data: { key } });
    return true;
  });
}
