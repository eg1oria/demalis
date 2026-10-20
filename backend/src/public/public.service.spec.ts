import { describe, expect, it } from '@jest/globals';
import { parseCatalogQuery } from './public.service';

describe('parseCatalogQuery', () => {
  it('разбирает фильтры каталога', () => {
    expect(
      parseCatalogQuery({
        drive: '60',
        guests: '6',
        amenities: 'has_chan,has_banya',
        type: 'aframe',
        dir: 'talgar',
        sort: 'price',
      }),
    ).toEqual({
      drive: 60,
      guests: 6,
      price_min: undefined,
      price_max: undefined,
      amenities: ['has_chan', 'has_banya'],
      type: 'aframe',
      dir: 'talgar',
      sort: 'price',
    });
  });

  it('мусор и свойства прототипа отбрасывает, а не передаёт в базу', () => {
    expect(
      parseCatalogQuery({
        amenities: 'constructor,toString,has_pool',
        type: 'constructor',
        dir: '__proto__',
        sort: 'random',
      }),
    ).toEqual({
      drive: undefined,
      guests: undefined,
      price_min: undefined,
      price_max: undefined,
      amenities: ['has_pool'],
      type: undefined,
      dir: undefined,
      sort: undefined,
    });
  });
});
