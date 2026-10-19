import { describe, expect, it } from '@jest/globals';
import { reviewTelegramMessage } from './message';

describe('reviewTelegramMessage', () => {
  it('звёзды, экранирование и ссылка', () => {
    const text = reviewTelegramMessage(
      { rating: 4, text: 'Чисто <и> тихо', author_name: 'Ержан' },
      'Дом у реки',
      'https://demalys.kz/admin/reviews',
    );
    expect(text).toContain('★★★★☆ · Ержан');
    expect(text).toContain('Чисто &lt;и&gt; тихо');
    expect(text).toContain('href="https://demalys.kz/admin/reviews"');
  });
});
