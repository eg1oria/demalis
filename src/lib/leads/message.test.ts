import { describe, expect, it } from "vitest";
import { leadTelegramMessage } from "./message";

const lead = {
  name: "Аня <script>",
  phone: "+77011234567",
  date_from: "2026-10-02",
  date_to: "2026-10-04",
  guests: 4,
  comment: "Баня & чан",
};

describe("leadTelegramMessage", () => {
  it("все поля, HTML экранирован", () => {
    expect(
      leadTelegramMessage(lead, "Дом <у реки>", "https://x.kz/admin/leads"),
    ).toBe(
      [
        "<b>Новая заявка</b> — Дом &lt;у реки&gt;",
        "Даты: 02.10.2026 – 04.10.2026",
        "Гостей: 4",
        "Имя: Аня &lt;script&gt;",
        "Телефон: +77011234567",
        "Комментарий: Баня &amp; чан",
        "",
        '<a href="https://x.kz/admin/leads">Все заявки</a>',
      ].join("\n"),
    );
  });

  it("без комментария и ссылки", () => {
    const text = leadTelegramMessage({ ...lead, comment: null }, "Дом", null);
    expect(text).not.toContain("Комментарий");
    expect(text).not.toContain("<a ");
  });
});
