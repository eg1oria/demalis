import { InlineKeyboard, Keyboard } from 'grammy';
import type { IsoDate } from '../shared/dates';
import {
  buildCallback,
  dayLabel,
  type DraftStatus,
  draftDates,
  encodeDraft,
  type UnitIndex,
} from './callbacks';
import { BOT_TEXTS, type BotLang } from './texts';

/** Постоянное меню владельца внизу чата. */
export function mainMenu(lang: BotLang): Keyboard {
  const m = BOT_TEXTS[lang].menu;
  return new Keyboard()
    .text(m.dates)
    .row()
    .text(m.weekendFree)
    .text(m.weekendFull)
    .row()
    .text(m.leads)
    .text(m.stats)
    .resized()
    .persistent();
}

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Русский', buildCallback({ kind: 'lang', lang: 'ru' }))
    .text('Қазақша', buildCallback({ kind: 'lang', lang: 'kk' }));
}

/** 14 дней по две кнопки в ряд + «Готово». Черновик — в данных кнопок. */
export function datesKeyboard(
  placeId: string,
  unit: UnitIndex,
  start: IsoDate,
  statuses: DraftStatus[],
  lang: BotLang,
): InlineKeyboard {
  const draft = encodeDraft(statuses);
  const keyboard = new InlineKeyboard();
  draftDates(start).forEach((date, index) => {
    keyboard.text(
      dayLabel(date, statuses[index], lang),
      buildCallback({ kind: 'toggle', placeId, unit, start, draft, index }),
    );
    if (index % 2 === 1) keyboard.row();
  });
  return keyboard.text(
    BOT_TEXTS[lang].done,
    buildCallback({ kind: 'save', placeId, unit, start, draft }),
  );
}

/** Какой домик отмечать: каждый отдельно или все сразу. */
export function unitsKeyboard(
  placeId: string,
  names: string[],
  lang: BotLang,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  names.forEach((name, unit) => {
    keyboard.text(name, buildCallback({ kind: 'unit', placeId, unit })).row();
  });
  return keyboard.text(
    BOT_TEXTS[lang].allUnits,
    buildCallback({ kind: 'unit', placeId, unit: null }),
  );
}

export function leadKeyboard(leadId: string, lang: BotLang): InlineKeyboard {
  const t = BOT_TEXTS[lang];
  return new InlineKeyboard()
    .text(
      t.contacted,
      buildCallback({ kind: 'lead', leadId, action: 'contacted' }),
    )
    .text(
      t.noAnswer,
      buildCallback({ kind: 'lead', leadId, action: 'noAnswer' }),
    );
}

export function remindKeyboard(lang: BotLang): InlineKeyboard {
  return new InlineKeyboard().text(
    BOT_TEXTS[lang].menu.dates,
    buildCallback({ kind: 'menu', action: 'dates' }),
  );
}
