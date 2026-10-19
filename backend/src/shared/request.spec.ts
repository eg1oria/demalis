import { describe, expect, it } from '@jest/globals';
import { rateLimitKey } from './request';

describe('rateLimitKey', () => {
  it('хэш без IP в открытом виде, зависит от секрета', () => {
    const key = rateLimitKey('1.2.3.4', 'secret');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('1.2.3.4');
    expect(rateLimitKey('1.2.3.4', 'secret')).toBe(key);
    expect(rateLimitKey('1.2.3.4', 'other')).not.toBe(key);
    expect(rateLimitKey('1.2.3.5', 'secret')).not.toBe(key);
    expect(rateLimitKey('1.2.3.4', 'secret', 'lead')).toBe(key);
    expect(rateLimitKey('1.2.3.4', 'secret', 'owner')).not.toBe(key);
  });
});
