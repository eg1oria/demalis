import { describe, expect, it } from '@jest/globals';
import { aggregateNight } from './units';

const units = [{ capacity: 4 }, { capacity: 2 }, { capacity: 6 }];

describe('статус объекта по домикам', () => {
  it('все свободны — «Свободно», места — сумма', () => {
    expect(aggregateNight(units, ['free', 'free', 'free'])).toEqual({
      status: 'free',
      free_capacity: 12,
    });
  });

  it('часть занята — «Мало мест», места только в незанятых', () => {
    expect(aggregateNight(units, ['free', 'full', 'limited'])).toEqual({
      status: 'limited',
      free_capacity: 10,
    });
  });

  it('свободный есть, остальные не отмечены — «Мало мест»', () => {
    expect(aggregateNight(units, ['free', null, null])).toEqual({
      status: 'limited',
      free_capacity: 4,
    });
  });

  it('все заняты — «Занято»', () => {
    expect(aggregateNight(units, ['full', 'full', 'full'])).toEqual({
      status: 'full',
      free_capacity: 0,
    });
  });

  it('свободных нет и не все отмечены — неизвестно', () => {
    expect(aggregateNight(units, ['full', null, 'full'])).toBeNull();
    expect(aggregateNight(units, [null, null, null])).toBeNull();
    expect(aggregateNight([], [])).toBeNull();
  });
});
