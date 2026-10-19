import "server-only";
import { Bot, type Context, GrammyError } from "grammy";
import { SITE_NAME } from "@/config/site";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { placeName } from "@/lib/places/present";
import { TELEGRAM_API_ROOT } from "@/lib/telegram/api";
import { getUpcomingWeekend } from "@/lib/weekend";
import {
  buildCallback,
  type Callback,
  cycleStatus,
  decodeDraft,
  draftDates,
  parseCallback,
} from "./callbacks";
import {
  type BotOwner,
  type BotPlace,
  getOwnerByChat,
  linkOwnerByCode,
  ownerLead,
  ownerPlace,
  ownerPlaces,
  ownerStats,
  placeStatuses,
  recentLeads,
  saveStatuses,
  setLeadStatus,
  setOwnerLanguage,
} from "./data";
import {
  datesKeyboard,
  languageKeyboard,
  leadKeyboard,
  mainMenu,
} from "./keyboards";
import { normalizeLinkCode } from "./linkCode";
import {
  leadsListMessage,
  nightsLabel,
  ownerLeadMessage,
  statsMessage,
} from "./messages";
import { BOT_TEXTS, type BotLang, menuAction } from "./texts";

type BotContext = Context & { owner: BotOwner | null };

const today = () => toIsoDate(almatyToday(new Date()));

/** Язык: выбранный владельцем, иначе по настройкам Telegram. */
function langOf(ctx: BotContext): BotLang {
  return (
    ctx.owner?.language ?? (ctx.from?.language_code === "kk" ? "kk" : "ru")
  );
}

const texts = (ctx: BotContext) => BOT_TEXTS[langOf(ctx)];

/** «message is not modified» — повторное нажатие той же кнопки, не ошибка. */
async function ignoreNotModified(action: Promise<unknown>) {
  try {
    await action;
  } catch (e) {
    if (!(e instanceof GrammyError && e.description.includes("not modified")))
      throw e;
  }
}

async function askLanguage(ctx: BotContext) {
  await ctx.reply(BOT_TEXTS.ru.chooseLanguage, {
    reply_markup: languageKeyboard(),
  });
}

/** Приветствие для чужих: без кода доступа нет ни к чему. */
async function greetStranger(ctx: BotContext, lang?: BotLang) {
  const greeting = lang
    ? BOT_TEXTS[lang].greeting(SITE_NAME)
    : `${BOT_TEXTS.ru.greeting(SITE_NAME)}\n\n${BOT_TEXTS.kk.greeting(SITE_NAME)}`;
  await ctx.reply(greeting, { reply_markup: { remove_keyboard: true } });
}

async function sendLinked(ctx: BotContext, owner: BotOwner, lang: BotLang) {
  const places = await ownerPlaces(owner.id);
  await ctx.reply(
    BOT_TEXTS[lang].linked(places.map((p) => placeName(p, lang))),
    { reply_markup: mainMenu(lang) },
  );
}

async function sendDates(ctx: BotContext, place: BotPlace, edit: boolean) {
  const lang = langOf(ctx);
  const start = today();
  const statuses = await placeStatuses(place.id, draftDates(start));
  const text = BOT_TEXTS[lang].datesTitle(placeName(place, lang));
  const reply_markup = datesKeyboard(place.id, start, statuses, lang);
  if (edit) await ctx.editMessageText(text, { reply_markup });
  else await ctx.reply(text, { reply_markup });
}

async function startDates(ctx: BotContext, owner: BotOwner) {
  const lang = langOf(ctx);
  const places = await ownerPlaces(owner.id);
  if (places.length === 0) return ctx.reply(BOT_TEXTS[lang].noPlaces);
  if (places.length === 1) return sendDates(ctx, places[0], false);
  await ctx.reply(BOT_TEXTS[lang].pickPlace, {
    reply_markup: {
      inline_keyboard: places.map((p) => [
        {
          text: placeName(p, lang),
          callback_data: buildCallback({ kind: "pick", placeId: p.id }),
        },
      ]),
    },
  });
}

async function markWeekend(
  ctx: BotContext,
  owner: BotOwner,
  status: "free" | "full",
) {
  const t = texts(ctx);
  const places = await ownerPlaces(owner.id);
  if (places.length === 0) return ctx.reply(t.noPlaces);
  const { nights } = getUpcomingWeekend(new Date());
  await saveStatuses(
    places.map((p) => p.id),
    nights.map((date) => ({ date, status })),
  );
  await ctx.reply(t.weekendSaved(status, nightsLabel(nights)));
}

async function handleCallback(ctx: BotContext, owner: BotOwner, cb: Callback) {
  const lang = langOf(ctx);
  const t = BOT_TEXTS[lang];

  switch (cb.kind) {
    case "menu":
      await ctx.answerCallbackQuery();
      return startDates(ctx, owner);

    case "pick": {
      const place = await ownerPlace(owner.id, cb.placeId);
      await ctx.answerCallbackQuery(place ? undefined : t.expired);
      if (place) await sendDates(ctx, place, true);
      return;
    }

    case "toggle": {
      const place = await ownerPlace(owner.id, cb.placeId);
      if (!place) return ctx.answerCallbackQuery(t.expired);
      const statuses = decodeDraft(cb.draft);
      statuses[cb.index] = cycleStatus(statuses[cb.index]);
      await ignoreNotModified(
        ctx.editMessageReplyMarkup({
          reply_markup: datesKeyboard(place.id, cb.start, statuses, lang),
        }),
      );
      return ctx.answerCallbackQuery();
    }

    case "save": {
      const place = await ownerPlace(owner.id, cb.placeId);
      if (!place) return ctx.answerCallbackQuery(t.expired);
      const statuses = decodeDraft(cb.draft);
      const from = today();
      const dates = draftDates(cb.start);
      if (dates[dates.length - 1] < from)
        return ctx.answerCallbackQuery(t.expired);
      // Прошедшие дни (кнопки открыли вчера) не сохраняем.
      const days = dates.flatMap((date, i) => {
        const status = statuses[i];
        return status && date >= from ? [{ date, status }] : [];
      });
      await saveStatuses([place.id], days);
      await ctx.editMessageText(t.saved(placeName(place, lang)));
      return ctx.answerCallbackQuery(t.statusSaved);
    }

    case "lead": {
      const lead = await ownerLead(owner.id, cb.leadId);
      if (!lead) return ctx.answerCallbackQuery(t.expired);
      const status = cb.action === "contacted" ? "confirmed" : "no_answer";
      await setLeadStatus(lead.id, status);
      await ignoreNotModified(
        ctx.editMessageText(
          ownerLeadMessage({ ...lead, status }, lead.place, lang),
          { reply_markup: leadKeyboard(lead.id, lang) },
        ),
      );
      return ctx.answerCallbackQuery(t.statusSaved);
    }

    case "lang":
      // Обрабатывается раньше, сюда не доходит.
      return ctx.answerCallbackQuery();
  }
}

export function createBot(token: string) {
  const bot = new Bot<BotContext>(token, {
    client: { apiRoot: TELEGRAM_API_ROOT },
  });
  // Бот работает только в личных сообщениях; группы и каналы игнорируем.
  const pm = bot.chatType("private");

  pm.use(async (ctx, next) => {
    ctx.owner = await getOwnerByChat(ctx.chat.id);
    await next();
  });

  pm.command("start", async (ctx) => {
    const payload = ctx.match.trim();
    if (payload) {
      const code = normalizeLinkCode(payload);
      const owner = code ? await linkOwnerByCode(code, ctx.chat.id) : null;
      if (!owner) {
        await ctx.reply(texts(ctx).badCode);
        if (!ctx.owner) await greetStranger(ctx, langOf(ctx));
        return;
      }
      ctx.owner = owner;
      if (!owner.language) return askLanguage(ctx);
      return sendLinked(ctx, owner, owner.language);
    }
    if (!ctx.owner?.language) return askLanguage(ctx);
    await ctx.reply(texts(ctx).menuHint, {
      reply_markup: mainMenu(ctx.owner.language),
    });
  });

  pm.on("callback_query:data", async (ctx) => {
    const cb = parseCallback(ctx.callbackQuery.data);
    if (!cb) return ctx.answerCallbackQuery();

    if (cb.kind === "lang") {
      await ctx.answerCallbackQuery();
      await ignoreNotModified(ctx.editMessageReplyMarkup());
      if (!ctx.owner) return greetStranger(ctx, cb.lang);
      await setOwnerLanguage(ctx.owner.id, cb.lang);
      ctx.owner = { ...ctx.owner, language: cb.lang };
      return sendLinked(ctx, ctx.owner, cb.lang);
    }

    if (!ctx.owner) {
      await ctx.answerCallbackQuery();
      return greetStranger(ctx);
    }
    await handleCallback(ctx, ctx.owner, cb);
  });

  pm.on("message", async (ctx) => {
    const owner = ctx.owner;
    if (!owner) return greetStranger(ctx);
    if (!owner.language) return askLanguage(ctx);
    const lang = owner.language;

    switch (menuAction(ctx.message.text ?? "")) {
      case "dates":
        return startDates(ctx, owner);
      case "weekendFree":
        return markWeekend(ctx, owner, "free");
      case "weekendFull":
        return markWeekend(ctx, owner, "full");
      case "leads":
        return ctx.reply(leadsListMessage(await recentLeads(owner.id), lang));
      case "stats":
        return ctx.reply(statsMessage(await ownerStats(owner.id), lang));
      default:
        return ctx.reply(BOT_TEXTS[lang].menuHint, {
          reply_markup: mainMenu(lang),
        });
    }
  });

  return bot;
}
