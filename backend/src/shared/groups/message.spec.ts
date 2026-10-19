import { describe, expect, it } from '@jest/globals';
import { groupRequestTelegramMessage } from './message';

describe('groupRequestTelegramMessage', () => {
  it('все поля и экранирование', () => {
    const text = groupRequestTelegramMessage(
      {
        name: 'Асель <b>',
        phone: '+77011234567',
        occasion: 'birthday',
        guests: 25,
        date_from: '2026-12-26',
        date_to: '2026-12-28',
        budget: 900000,
        direction: 'talgar',
        amenities: ['has_banya', 'has_pool'],
        comment: null,
      },
      'https://demalys.kz/admin/groups',
    );
    expect(text).toContain('День рождения, 25 чел.');
    expect(text).toContain('Даты: 26.12.2026 – 28.12.2026');
    expect(text).toContain('Нужно: Баня, Бассейн');
    expect(text).toContain('Имя: Асель &lt;b&gt;');
    expect(text).toContain('href="https://demalys.kz/admin/groups"');
  });

  it('без дат', () => {
    const text = groupRequestTelegramMessage(
      {
        name: 'Ержан',
        phone: '+77011234567',
        occasion: 'corporate',
        guests: 60,
        date_from: null,
        date_to: null,
        budget: null,
        direction: null,
        amenities: [],
        comment: null,
      },
      null,
    );
    expect(text).toContain('Даты: ещё не решили');
    expect(text).not.toContain('Бюджет');
  });
});
