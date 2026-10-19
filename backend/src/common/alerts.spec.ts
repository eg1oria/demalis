import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  ALERT_COOLDOWN_MS,
  alertText,
  resetAlerts,
  shouldAlert,
} from './alerts';

describe('оповещения об ошибках', () => {
  beforeEach(() => resetAlerts());

  it('одинаковая ошибка — не чаще раза в 10 минут', () => {
    const t = 1_000_000;
    expect(shouldAlert('GET /x|boom', t)).toBe(true);
    expect(shouldAlert('GET /x|boom', t + 1000)).toBe(false);
    expect(shouldAlert('GET /x|other', t + 1000)).toBe(true);
    expect(shouldAlert('GET /x|boom', t + ALERT_COOLDOWN_MS)).toBe(true);
  });

  it('экранирует HTML и обрезает длинный стек', () => {
    const error = new Error('<script>');
    error.stack = `Error: <script> & ${'x'.repeat(5000)}`;
    const text = alertText('GET /a<b>', error);
    expect(text).toContain('GET /a&lt;b&gt;');
    expect(text).toContain('&lt;script&gt; &amp;');
    expect(text).not.toContain('<script>');
    expect(text.length).toBeLessThan(4096);
  });

  it('не Error — тоже текст', () => {
    expect(alertText('cron', 'не доставлено: 2')).toContain('не доставлено: 2');
  });
});
