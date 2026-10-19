import { describe, expect, it } from '@jest/globals';
import {
  BOT_DAYS,
  buildCallback,
  type Callback,
  cycleStatus,
  dayLabel,
  decodeDraft,
  draftDates,
  encodeDraft,
  parseCallback,
} from './callbacks';

const ID = '3f1c2a54-9b1e-4c4e-8f1d-2a0b7c9d1e2f';
const DRAFT = '0flx0flx0flx0f';

describe('черновик отметок', () => {
  it('кодирует и раскодирует статусы', () => {
    const statuses = decodeDraft(DRAFT);
    expect(statuses.slice(0, 4)).toEqual([null, 'free', 'limited', 'full']);
    expect(encodeDraft(statuses)).toBe(DRAFT);
  });

  it('по кругу 🟢 → 🟡 → 🔴 → 🟢, неотмеченный → 🟢', () => {
    expect(cycleStatus(null)).toBe('free');
    expect(cycleStatus('free')).toBe('limited');
    expect(cycleStatus('limited')).toBe('full');
    expect(cycleStatus('full')).toBe('free');
  });

  it('14 дней подряд, через конец месяца', () => {
    const dates = draftDates('2026-09-27');
    expect(dates).toHaveLength(BOT_DAYS);
    expect(dates[0]).toBe('2026-09-27');
    expect(dates[4]).toBe('2026-10-01');
    expect(dates[13]).toBe('2026-10-10');
  });

  it('подпись кнопки «Сб 04.10 🟢»', () => {
    expect(dayLabel('2026-10-03', 'free', 'ru')).toBe('Сб 03.10 🟢');
    expect(dayLabel('2026-10-04', null, 'ru')).toBe('Вс 04.10 ⚪');
    expect(dayLabel('2026-10-02', 'full', 'kk')).toBe('Жм 02.10 🔴');
    expect(dayLabel('2026-10-05', 'limited', 'ru')).toBe('Пн 05.10 🟡');
  });
});

describe('кнопки до Этапа 14', () => {
  it('без домика — весь объект', () => {
    expect(
      parseCallback(`t:${ID.replace(/-/g, '')}:260927:${DRAFT}:3`),
    ).toEqual({
      kind: 'toggle',
      placeId: ID,
      unit: null,
      start: '2026-09-27',
      draft: DRAFT,
      index: 3,
    });
    expect(parseCallback(`s:${ID.replace(/-/g, '')}:260927:${DRAFT}`)).toEqual({
      kind: 'save',
      placeId: ID,
      unit: null,
      start: '2026-09-27',
      draft: DRAFT,
    });
  });
});

describe('callback_data', () => {
  const all: Callback[] = [
    { kind: 'lang', lang: 'kk' },
    { kind: 'menu', action: 'dates' },
    { kind: 'pick', placeId: ID },
    {
      kind: 'toggle',
      placeId: ID,
      unit: null,
      start: '2026-09-27',
      draft: DRAFT,
      index: 13,
    },
    {
      kind: 'toggle',
      placeId: ID,
      unit: 35,
      start: '2026-09-27',
      draft: DRAFT,
      index: 13,
    },
    {
      kind: 'save',
      placeId: ID,
      unit: null,
      start: '2026-12-31',
      draft: DRAFT,
    },
    { kind: 'save', placeId: ID, unit: 2, start: '2026-12-31', draft: DRAFT },
    { kind: 'unit', placeId: ID, unit: 0 },
    { kind: 'unit', placeId: ID, unit: null },
    { kind: 'lead', leadId: ID, action: 'contacted' },
    { kind: 'lead', leadId: ID, action: 'noAnswer' },
    { kind: 'holiday', placeId: ID, night: '2026-12-31', status: 'free' },
    { kind: 'holiday', placeId: ID, night: '2026-12-31', status: 'full' },
    { kind: 'holidaySkip', placeId: ID, night: '2026-12-31' },
  ];

  it.each(all)('$kind: туда-обратно и не длиннее 64 байт', (cb) => {
    const data = buildCallback(cb);
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64);
    expect(parseCallback(data)).toEqual(cb);
  });

  it.each([
    '',
    'lang:en',
    'menu:leads',
    'pick:xyz',
    `pick:${'a'.repeat(31)}`,
    `t:${'a'.repeat(32)}:260927:${DRAFT}:14`,
    `t:${'a'.repeat(32)}:260927:${DRAFT}:-1`,
    `t:${'a'.repeat(32)}:260231:${DRAFT}:1`,
    `t:${'a'.repeat(32)}:260927:0flx:1`,
    `s:${'a'.repeat(32)}:260927:${DRAFT.replace('0', 'z')}`,
    `lead:${'a'.repeat(32)}:x`,
    `lead:${'a'.repeat(32)}:c:extra`,
    `hs:${'a'.repeat(32)}:261231:0`,
    `hs:${'a'.repeat(32)}:261231:q`,
    `hs:${'a'.repeat(32)}:261232:f`,
    `hs:${'a'.repeat(32)}:261231`,
    `hp:${'a'.repeat(32)}:261231:f`,
    `t:${'a'.repeat(32)}:A:260927:${DRAFT}:1`,
    `pu:${'a'.repeat(32)}:`,
    `pu:${'a'.repeat(32)}:ab`,
  ])('отклоняет «%s»', (data) => {
    expect(parseCallback(data)).toBeNull();
  });
});
