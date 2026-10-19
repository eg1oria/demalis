import { describe, expect, it } from '@jest/globals';
import { firstName, validateReview } from './validate';

const base = {
  rating: '5',
  text: 'Отличное место,   чистые домики и вкусный плов.\n\n\n\nВернёмся!',
  name: '  Айгерим  Сапарова ',
  consent: 'on',
};

describe('validateReview', () => {
  it('нормализует текст и имя', () => {
    expect(validateReview(base)).toEqual({
      ok: true,
      data: {
        rating: 5,
        text: 'Отличное место, чистые домики и вкусный плов.\n\nВернёмся!',
        author_name: 'Айгерим Сапарова',
      },
    });
  });

  it('оценка только 1–5', () => {
    for (const rating of ['0', '6', '4.5', 'abc'])
      expect(validateReview({ ...base, rating })).toEqual({
        ok: false,
        errors: { rating: 'invalid' },
      });
  });

  it('собирает все ошибки сразу', () => {
    expect(validateReview({ text: 'Коротко' })).toEqual({
      ok: false,
      errors: {
        rating: 'required',
        text: 'tooShort',
        name: 'required',
        consent: 'required',
      },
    });
  });
});

describe('firstName', () => {
  it('только имя', () => {
    expect(firstName(' Айгерим  Сапарова')).toBe('Айгерим');
    expect(firstName('Ержан')).toBe('Ержан');
  });
});
