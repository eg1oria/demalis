import { afterEach, describe, expect, it } from '@jest/globals';
import { isAdminEmail, parseAdminEmails } from './emails';

describe('ADMIN_EMAILS', () => {
  const saved = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = saved;
  });

  it('разбирает список через запятую с пробелами', () => {
    expect(parseAdminEmails(' A@x.kz, b@y.kz ,,')).toEqual(
      new Set(['a@x.kz', 'b@y.kz']),
    );
  });

  it('пускает только email из списка, без учёта регистра', () => {
    process.env.ADMIN_EMAILS = 'admin@demalys.kz';
    expect(isAdminEmail('Admin@Demalys.kz')).toBe(true);
    expect(isAdminEmail('hacker@demalys.kz')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it('пустой ADMIN_EMAILS — никого не пускает', () => {
    process.env.ADMIN_EMAILS = '';
    expect(isAdminEmail('admin@demalys.kz')).toBe(false);
  });
});
