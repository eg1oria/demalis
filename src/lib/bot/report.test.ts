import { describe, expect, it } from "vitest";
import { formatChange, monthlyReportMessage } from "./report";

describe("formatChange", () => {
  it.each([
    [120, 105, "+14%"],
    [12, 15, "−20%"],
    [3, 3, "без изменений"],
    [5, 0, null],
    [0, 0, null],
    [0, 4, "−100%"],
  ])("%i против %i → %s", (cur, prev, expected) => {
    expect(formatChange(cur, prev, "ru")).toBe(expected);
  });
});

describe("monthlyReportMessage", () => {
  const rows = [
    {
      place: { name_ru: "Дом у реки", name_kk: "Өзен жағасындағы үй" },
      current: { views: 120, whatsapp: 12, leads: 3 },
      previous: { views: 105, whatsapp: 15, leads: 3 },
    },
  ];

  it("русский, с Pro-строкой", () => {
    expect(
      monthlyReportMessage({
        lang: "ru",
        month: "2026-09",
        rows,
        proLine: true,
      }),
    ).toBe(
      [
        "📊 Отчёт за сентябрь 2026",
        "Дом у реки\nПросмотры: 120 (август: 105, +14%)\nКлики WhatsApp: 12 (август: 15, −20%)\nЗаявки: 3 (август: 3, без изменений)",
        "💡 С Pro гости видят ваш календарь «Свободно», плашку «Проверено» и до 20 фото — напишите администратору сайта.",
      ].join("\n\n"),
    );
  });

  it("январь сравнивается с декабрём прошлого года; без Pro-строки", () => {
    const text = monthlyReportMessage({
      lang: "ru",
      month: "2027-01",
      rows,
      proLine: false,
    });
    expect(text.startsWith("📊 Отчёт за январь 2027")).toBe(true);
    expect(text).toContain("(декабрь: 105, +14%)");
    expect(text).not.toContain("💡");
  });

  it("казахский", () => {
    const text = monthlyReportMessage({
      lang: "kk",
      month: "2026-09",
      rows,
      proLine: true,
    });
    expect(text).toContain("2026 ж. қыркүйек айының есебі");
    expect(text).toContain("Өзен жағасындағы үй");
    expect(text).toContain("Қаралым: 120 (тамыз: 105, +14%)");
    expect(text).toContain("Өтінімдер: 3 (тамыз: 3, өзгеріссіз)");
  });
});
