import type { AvailabilityStatus } from "@/lib/places/constants";
import type { LeadStatus } from "@/lib/leads/constants";

/** Язык бота: выбирается при первом /start. */
export const BOT_LANGS = ["ru", "kk"] as const;
export type BotLang = (typeof BOT_LANGS)[number];

export function isBotLang(value: unknown): value is BotLang {
  return BOT_LANGS.includes(value as BotLang);
}

type Texts = {
  chooseLanguage: string;
  greeting: (site: string) => string;
  badCode: string;
  linked: (places: string[]) => string;
  noPlaces: string;
  menuHint: string;
  menu: {
    dates: string;
    weekendFree: string;
    weekendFull: string;
    leads: string;
    stats: string;
  };
  pickPlace: string;
  datesTitle: (place: string) => string;
  done: string;
  saved: (place: string) => string;
  expired: string;
  weekendSaved: (status: "free" | "full", dates: string) => string;
  noLeads: string;
  leadsTitle: string;
  guests: (n: number) => string;
  statsTitle: string;
  statsLine: (views: number, clicks: number, leads: number) => string;
  statsProOnly: string;
  proEnding: (place: string, date: string) => string;
  newLead: string;
  leadName: string;
  leadPhone: string;
  leadComment: string;
  leadStatus: string;
  contacted: string;
  noAnswer: string;
  statusSaved: string;
  reminder: string;
  weekdays: string[];
  leadStatuses: Record<LeadStatus, string>;
  statuses: Record<AvailabilityStatus, string>;
};

const ru: Texts = {
  chooseLanguage: "Выберите язык · Тілді таңдаңыз",
  greeting: (site) =>
    `Здравствуйте! Это бот ${site} для владельцев мест отдыха.\n\nЧтобы подключиться, попросите у администратора код и отправьте сюда: /start КОД`,
  badCode:
    "Код не подошёл: он неверный или уже использован. Попросите у администратора новый код.",
  linked: (places) =>
    places.length > 0
      ? `Готово, вы подключены! Ваши объекты:\n${places.map((p) => `• ${p}`).join("\n")}\n\nОтмечайте свободные даты кнопками внизу.`
      : "Готово, вы подключены! Объекты к вам пока не привязаны — администратор добавит их.",
  noPlaces:
    "К вам пока не привязан ни один объект. Напишите администратору сайта.",
  menuHint: "Выберите действие кнопками внизу.",
  menu: {
    dates: "📅 Отметить даты",
    weekendFree: "🟢 Всё свободно на выходные",
    weekendFull: "🔴 Всё занято на выходные",
    leads: "📨 Мои заявки",
    stats: "📊 Статистика",
  },
  pickPlace: "Какой объект?",
  datesTitle: (place) =>
    `${place}\n\nНажимайте на дату, чтобы поменять статус: 🟢 свободно → 🟡 мало мест → 🔴 занято. ⚪ — не отмечено.\nВ конце нажмите «Готово».`,
  done: "✅ Готово",
  saved: (place) => `Сохранено: ${place}. Спасибо! Гости увидят это на сайте.`,
  expired: "Эти кнопки устарели. Нажмите «📅 Отметить даты» ещё раз.",
  weekendSaved: (status, dates) =>
    `Отмечено ${status === "free" ? "🟢 свободно" : "🔴 занято"} на ночи ${dates} — во всех ваших объектах.`,
  noLeads: "Заявок пока нет.",
  leadsTitle: "Последние заявки:",
  guests: (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    const word =
      mod10 === 1 && mod100 !== 11
        ? "гость"
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
          ? "гостя"
          : "гостей";
    return `${n} ${word}`;
  },
  statsTitle: "Статистика за 7 дней:",
  statsLine: (views, clicks, leads) =>
    `просмотры: ${views} · WhatsApp: ${clicks} · заявки: ${leads}`,
  statsProOnly: "статистика доступна в тарифе Pro — спросите администратора",
  proEnding: (place, date) =>
    `Тариф Pro для «${place}» заканчивается ${date}. После этого на сайте пропадут календарь занятости и плашка «Проверено». Чтобы продлить — напишите администратору сайта.`,
  newLead: "Новая заявка",
  leadName: "Имя",
  leadPhone: "Телефон",
  leadComment: "Комментарий",
  leadStatus: "Статус",
  contacted: "Связался ✅",
  noAnswer: "Не дозвонился",
  statusSaved: "Статус сохранён",
  reminder:
    "Обновите занятость на выходные — так гости увидят, что у вас свободно.",
  weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  leadStatuses: {
    new: "новая",
    sent_to_owner: "отправлена вам",
    confirmed: "связались",
    cancelled: "отменена",
    no_answer: "не дозвонились",
  },
  statuses: { free: "свободно", limited: "мало мест", full: "занято" },
};

// TODO: проверить носителю — весь блок kk.
const kk: Texts = {
  chooseLanguage: "Тілді таңдаңыз · Выберите язык",
  greeting: (site) =>
    `Сәлеметсіз бе! Бұл — демалыс орындары иелеріне арналған ${site} боты.\n\nҚосылу үшін әкімшіден код сұрап, осында жіберіңіз: /start КОД`,
  badCode:
    "Код жарамсыз: қате немесе бұрын қолданылған. Әкімшіден жаңа код сұраңыз.",
  linked: (places) =>
    places.length > 0
      ? `Дайын, сіз қосылдыңыз! Сіздің нысандарыңыз:\n${places.map((p) => `• ${p}`).join("\n")}\n\nБос күндерді төмендегі батырмалармен белгілеңіз.`
      : "Дайын, сіз қосылдыңыз! Сізге әлі нысан тіркелмеген — әкімші қосады.",
  noPlaces: "Сізге әлі бірде-бір нысан тіркелмеген. Сайт әкімшісіне жазыңыз.",
  menuHint: "Төмендегі батырмалармен әрекетті таңдаңыз.",
  menu: {
    dates: "📅 Күндерді белгілеу",
    weekendFree: "🟢 Демалыста бәрі бос",
    weekendFull: "🔴 Демалыста бәрі бос емес",
    leads: "📨 Менің өтінімдерім",
    stats: "📊 Статистика",
  },
  pickPlace: "Қай нысан?",
  datesTitle: (place) =>
    `${place}\n\nКүйін өзгерту үшін күнді басыңыз: 🟢 бос → 🟡 орын аз → 🔴 бос емес. ⚪ — белгіленбеген.\nСоңында «Дайын» батырмасын басыңыз.`,
  done: "✅ Дайын",
  saved: (place) => `Сақталды: ${place}. Рақмет! Қонақтар мұны сайттан көреді.`,
  expired:
    "Бұл батырмалар ескірді. «📅 Күндерді белгілеу» батырмасын қайта басыңыз.",
  weekendSaved: (status, dates) =>
    `Белгіленді: ${dates} түндері ${status === "free" ? "🟢 бос" : "🔴 бос емес"} — барлық нысандарыңызда.`,
  noLeads: "Әзірге өтінім жоқ.",
  leadsTitle: "Соңғы өтінімдер:",
  guests: (n) => `${n} қонақ`,
  statsTitle: "7 күндегі статистика:",
  statsLine: (views, clicks, leads) =>
    `қаралым: ${views} · WhatsApp: ${clicks} · өтінім: ${leads}`,
  statsProOnly: "статистика Pro тарифінде қолжетімді — әкімшіден сұраңыз",
  proEnding: (place, date) =>
    `«${place}» үшін Pro тарифі ${date} аяқталады. Одан кейін сайтта бос күндер күнтізбесі мен «Тексерілген» белгісі жоғалады. Ұзарту үшін сайт әкімшісіне жазыңыз.`,
  newLead: "Жаңа өтінім",
  leadName: "Аты",
  leadPhone: "Телефон",
  leadComment: "Пікір",
  leadStatus: "Күйі",
  contacted: "Хабарластым ✅",
  noAnswer: "Қоңырау өтпеді",
  statusSaved: "Күйі сақталды",
  reminder:
    "Демалыс күндеріндегі бос орындарды жаңартыңыз — қонақтар бос екенін көреді.",
  weekdays: ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сн"],
  leadStatuses: {
    new: "жаңа",
    sent_to_owner: "сізге жіберілді",
    confirmed: "хабарластыңыз",
    cancelled: "бас тартылды",
    no_answer: "қоңырау өтпеді",
  },
  statuses: { free: "бос", limited: "орын аз", full: "бос емес" },
};

export const BOT_TEXTS: Record<BotLang, Texts> = { ru, kk };

/** Какая кнопка меню нажата — сверяем с текстами обоих языков. */
export function menuAction(text: string): keyof Texts["menu"] | null {
  for (const lang of BOT_LANGS) {
    const menu = BOT_TEXTS[lang].menu;
    const key = (Object.keys(menu) as (keyof Texts["menu"])[]).find(
      (k) => menu[k] === text.trim(),
    );
    if (key) return key;
  }
  return null;
}
