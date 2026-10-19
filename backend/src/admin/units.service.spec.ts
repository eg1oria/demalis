import { describe, expect, it } from '@jest/globals';
import { validateUnit } from './units.service';

describe('домик из формы', () => {
  it('нормализует поля', () => {
    expect(
      validateUnit({
        name_ru: ' Домик у реки ',
        name_kk: '',
        capacity: '4',
        price_weekday: '35000',
        price_weekend: 50000,
        price_holiday: '',
      }),
    ).toEqual({
      data: {
        name_ru: 'Домик у реки',
        name_kk: null,
        capacity: 4,
        price_weekday: 35000,
        price_weekend: 50000,
        price_holiday: null,
        sort_order: 100,
      },
    });
  });

  it.each([
    [{ name_ru: '', capacity: 4 }, 'Название'],
    [{ name_ru: 'А', capacity: 0 }, 'Мест'],
    [{ name_ru: 'А', capacity: 2.5 }, 'Мест'],
    [{ name_ru: 'А', capacity: 2, price_weekday: '-1' }, 'Цены'],
    [{ name_ru: 'А', capacity: 2, price_weekend: 'дорого' }, 'Цены'],
  ])('ошибка %#', (body, text) => {
    const result = validateUnit(body);
    expect('error' in result && result.error).toContain(text);
  });
});
