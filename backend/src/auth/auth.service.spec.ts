import { describe, expect, it } from '@jest/globals';
import { isDevLoginAllowed } from './auth.service';

describe('isDevLoginAllowed', () => {
  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'разработка, запрос с этого компьютера (%s) — можно',
    (ip) => {
      expect(isDevLoginAllowed(ip, 'development')).toBe(true);
      expect(isDevLoginAllowed(ip, undefined)).toBe(true);
    },
  );

  it('запрос не с этого компьютера или через прокси — нельзя', () => {
    expect(isDevLoginAllowed('203.0.113.5', undefined)).toBe(false);
    expect(isDevLoginAllowed('172.18.0.4', 'development')).toBe(false);
    expect(isDevLoginAllowed(undefined, 'development')).toBe(false);
  });

  it('production — нельзя даже с localhost', () => {
    expect(isDevLoginAllowed('127.0.0.1', 'production')).toBe(false);
  });
});
