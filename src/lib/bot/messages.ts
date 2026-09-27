import type { IsoDate } from "@/lib/dates";
import type { LeadStatus } from "@/lib/leads/constants";
import { placeName } from "@/lib/places/present";
import { type BotLang, BOT_TEXTS } from "./texts";

/** «02.10» */
export const shortDate = (iso: IsoDate) =>
  `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/** «02.10, 03.10» — ночи выходных. */
export const nightsLabel = (nights: IsoDate[]) =>
  nights.map(shortDate).join(", ");

type LeadLike = {
  name: string;
  phone: string;
  date_from: string | null;
  date_to: string | null;
  guests: number | null;
  comment: string | null;
  status: LeadStatus;
};

const datesLine = (lead: LeadLike, lang: BotLang) =>
  [
    lead.date_from && lead.date_to
      ? `${shortDate(lead.date_from)}–${shortDate(lead.date_to)}`
      : null,
    lead.guests ? BOT_TEXTS[lang].guests(lead.guests) : null,
  ]
    .filter(Boolean)
    .join(" · ");

/** Заявка владельцу: с кнопками «Связался ✅» / «Не дозвонился» (без разметки — plain text). */
export function ownerLeadMessage(
  lead: LeadLike,
  place: { name_ru: string; name_kk: string | null },
  lang: BotLang,
): string {
  const t = BOT_TEXTS[lang];
  const lines = [
    `📨 ${t.newLead} — ${placeName(place, lang)}`,
    datesLine(lead, lang),
    `${t.leadName}: ${lead.name}`,
    `${t.leadPhone}: ${lead.phone}`,
  ];
  if (lead.comment) lines.push(`${t.leadComment}: ${lead.comment}`);
  if (lead.status !== "new" && lead.status !== "sent_to_owner")
    lines.push("", `${t.leadStatus}: ${t.leadStatuses[lead.status]}`);
  return lines.join("\n");
}

/** «Мои заявки»: последние заявки списком. */
export function leadsListMessage(
  leads: (LeadLike & {
    created_at: string;
    place: { name_ru: string; name_kk: string | null };
  })[],
  lang: BotLang,
): string {
  const t = BOT_TEXTS[lang];
  if (leads.length === 0) return t.noLeads;
  const blocks = leads.map((lead) =>
    [
      `${placeName(lead.place, lang)}`,
      datesLine(lead, lang),
      `${lead.name}, ${lead.phone}`,
      `${t.leadStatus}: ${t.leadStatuses[lead.status]}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [t.leadsTitle, ...blocks].join("\n\n");
}

export function statsMessage(
  rows: {
    place: { name_ru: string; name_kk: string | null };
    views: number;
    clicks: number;
    leads: number;
  }[],
  lang: BotLang,
): string {
  const t = BOT_TEXTS[lang];
  if (rows.length === 0) return t.noPlaces;
  return [
    t.statsTitle,
    ...rows.map(
      (r) =>
        `${placeName(r.place, lang)}\n${t.statsLine(r.views, r.clicks, r.leads)}`,
    ),
  ].join("\n\n");
}
