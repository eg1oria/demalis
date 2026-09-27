import { describe, expect, it } from "vitest";
import { validatePayment } from "./validate";

describe("validatePayment", () => {
  const valid = {
    amount: "15 000",
    kind: "pro",
    paid_at: "2026-10-05",
    comment: "  Kaspi, счёт №12 ",
  };

  it("правильная оплата, пробелы в сумме допустимы", () => {
    expect(validatePayment(valid)).toEqual({
      ok: true,
      data: {
        amount: 15000,
        kind: "pro",
        paid_at: "2026-10-05",
        comment: "Kaspi, счёт №12",
      },
    });
  });

  it.each([
    [{ amount: "0" }, "Сумма"],
    [{ amount: "-5" }, "Сумма"],
    [{ amount: "15.5" }, "Сумма"],
    [{ amount: "" }, "Сумма"],
    [{ kind: "gift" }, "за что"],
    [{ paid_at: "2026-02-30" }, "Дата"],
    [{ paid_at: "" }, "Дата"],
    [{ comment: "я".repeat(501) }, "Комментарий"],
  ])("%o → ошибка «%s»", (patch, text) => {
    const r = validatePayment({ ...valid, ...patch });
    expect(!r.ok && r.error).toContain(text);
  });

  it("пустой комментарий → null", () => {
    const r = validatePayment({ ...valid, comment: " " });
    expect(r.ok && r.data.comment).toBeNull();
  });
});
