import { describe, expect, it } from '@jest/globals';
import {
  decodeAwaiting,
  encodeAwaiting,
  isNightPrice,
  nightLabel,
  parseNightPrice,
} from './holiday';

const ID = '3f1c2a54-9b1e-4c4e-8f1d-2a0b7c9d1e2f';

describe('цена за праздничную ночь', () => {
  it.each([
    ['80000', 80000],
    ['80 000', 80000],
    ['80 000 ₸', 80000],
    ['80 000₸', 80000],
    ['120000 тг', 120000],
    [' 45000 тенге ', 45000],
    ['1000', 1000],
    ['5000000', 5000000],
  ])('«%s» → %d', (text, price) => {
    expect(parseNightPrice(text)).toBe(price);
  });

  it.each(['', 'дорого', '80к', '80.000', '-5000', '999', '5000001', '1e5'])(
    '«%s» — не цена',
    (text) => {
      expect(parseNightPrice(text)).toBeNull();
    },
  );

  it('проверка числа из админки', () => {
    expect(isNightPrice(80000)).toBe(true);
    expect(isNightPrice(80000.5)).toBe(false);
    expect(isNightPrice('80000')).toBe(false);
    expect(isNightPrice(500)).toBe(false);
  });
});

describe('ожидание цены (owners.awaiting_input)', () => {
  it('туда-обратно', () => {
    const value = encodeAwaiting({ placeId: ID, night: '2026-12-31' });
    expect(decodeAwaiting(value)).toEqual({ placeId: ID, night: '2026-12-31' });
  });

  it.each([null, '', 'price:abc:2026-12-31', `other:${ID}:2026-12-31`])(
    'мусор «%s» → null',
    (value) => {
      expect(decodeAwaiting(value)).toBeNull();
    },
  );
});

describe('подпись ночи', () => {
  it('через Новый год', () => {
    expect(nightLabel('2026-12-31')).toBe('31.12 → 01.01');
  });

  it('через конец месяца', () => {
    expect(nightLabel('2027-03-31')).toBe('31.03 → 01.04');
  });
});
