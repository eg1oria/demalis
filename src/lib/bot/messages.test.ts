import { describe, expect, it } from "vitest";
import {
  leadsListMessage,
  nightsLabel,
  ownerLeadMessage,
  statsMessage,
} from "./messages";

const place = { name_ru: "Дом у реки", name_kk: "Өзен жағасындағы үй" };
const lead = {
  name: "Айгерим",
  phone: "+77011234567",
  date_from: "2026-10-02",
  date_to: "2026-10-04",
  guests: 4,
  comment: "С собакой",
  status: "sent_to_owner" as const,
};

describe("сообщения бота", () => {
  it("ночи выходных", () => {
    expect(nightsLabel(["2026-10-02", "2026-10-03"])).toBe("02.10, 03.10");
  });

  it("заявка владельцу", () => {
    expect(ownerLeadMessage(lead, place, "ru")).toBe(
      [
        "📨 Новая заявка — Дом у реки",
        "02.10–04.10 · 4 гостя",
        "Имя: Айгерим",
        "Телефон: +77011234567",
        "Комментарий: С собакой",
      ].join("\n"),
    );
  });

  it("после нажатия кнопки — статус; на казахском — казахское название", () => {
    const text = ownerLeadMessage(
      { ...lead, status: "no_answer", comment: null },
      place,
      "kk",
    );
    expect(text).toContain("Өзен жағасындағы үй");
    expect(text).toContain("Күйі: қоңырау өтпеді");
    expect(text).not.toContain("Пікір");
  });

  it("список заявок и пустой список", () => {
    expect(leadsListMessage([], "ru")).toBe("Заявок пока нет.");
    const text = leadsListMessage(
      [{ ...lead, created_at: "2026-09-27T10:00:00Z", place }],
      "ru",
    );
    expect(text).toBe(
      [
        "Последние заявки:",
        "Дом у реки\n02.10–04.10 · 4 гостя\nАйгерим, +77011234567\nСтатус: отправлена вам",
      ].join("\n\n"),
    );
  });

  it("статистика", () => {
    expect(
      statsMessage([{ place, views: 12, clicks: 3, leads: 1 }], "ru"),
    ).toBe(
      "Статистика за 7 дней:\n\nДом у реки\nпросмотры: 12 · WhatsApp: 3 · заявки: 1",
    );
    expect(statsMessage([], "ru")).toContain("не привязан");
  });
});
