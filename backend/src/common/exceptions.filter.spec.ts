import { describe, expect, it } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { normalizeException } from './exceptions.filter';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('ошибка', {
    code,
    clientVersion: 'test',
  });

describe('normalizeException', () => {
  it('запись не найдена (P2025) → 404', () => {
    expect(normalizeException(prismaError('P2025'))).toBeInstanceOf(
      NotFoundException,
    );
  });

  it('остальные ошибки не трогает', () => {
    const unique = prismaError('P2002');
    const plain = new Error('сбой');
    expect(normalizeException(unique)).toBe(unique);
    expect(normalizeException(plain)).toBe(plain);
  });
});
