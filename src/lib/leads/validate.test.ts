import { describe, expect, it } from "vitest";
import { validateLead } from "./validate";

const TODAY = "2026-10-01";
const valid = {
  name: "  Айгерим   Н. ",
  phone: "8 701 123 45 67",
  dateFrom: "2026-10-02",
  dateTo: "2026-10-04",
  guests: "4",
  comment: "  С собакой  ",
  consent: "on",
};

describe("validateLead", () => {
  it("принимает правильную заявку и нормализует поля", () => {
    expect(validateLead(valid, TODAY)).toEqual({
      ok: true,
      data: {
        name: "Айгерим Н.",
        phone: "+77011234567",
        date_from: "2026-10-02",
        date_to: "2026-10-04",
        guests: 4,
        comment: "С собакой",
      },
    });
  });

  it("пустой комментарий → null, заезд сегодня допустим", () => {
    const result = validateLead(
      { ...valid, comment: "   ", dateFrom: TODAY },
      TODAY,
    );
    expect(result.ok && result.data.comment).toBeNull();
    expect(result.ok && result.data.date_from).toBe(TODAY);
  });

  it("обязательные поля", () => {
    expect(validateLead({}, TODAY)).toEqual({
      ok: false,
      errors: {
        name: "required",
        phone: "required",
        dateFrom: "required",
        dateTo: "required",
        guests: "invalid",
        consent: "required",
      },
    });
  });

  it("без согласия заявку не принимаем", () => {
    for (const consent of [undefined, "", "off", "true"]) {
      const r = validateLead({ ...valid, consent }, TODAY);
      expect(!r.ok && r.errors).toEqual({ consent: "required" });
    }
  });

  it("неверный телефон", () => {
    for (const phone of ["123", "+7 495 123 45 67", "+77011234567999"]) {
      const result = validateLead({ ...valid, phone }, TODAY);
      expect(!result.ok && result.errors).toEqual({ phone: "invalid" });
    }
  });

  it("заезд в прошлом, слишком далеко, несуществующая дата", () => {
    const check = (dateFrom: string) => {
      const r = validateLead(
        { ...valid, dateFrom, dateTo: "2026-10-04" },
        TODAY,
      );
      return !r.ok && r.errors.dateFrom;
    };
    expect(check("2026-09-30")).toBe("past");
    expect(check("2026-02-30")).toBe("invalid");
    expect(check("02.10.2026")).toBe("invalid");
    const far = validateLead(
      { ...valid, dateFrom: "2027-10-02", dateTo: "2027-10-03" },
      TODAY,
    );
    expect(!far.ok && far.errors.dateFrom).toBe("tooFar");
  });

  it("выезд не раньше следующего дня и не больше 30 ночей", () => {
    const check = (dateTo: string) => {
      const r = validateLead({ ...valid, dateTo }, TODAY);
      return r.ok ? "ok" : r.errors.dateTo;
    };
    expect(check("2026-10-02")).toBe("beforeFrom");
    expect(check("2026-10-01")).toBe("beforeFrom");
    expect(check("2026-10-03")).toBe("ok");
    expect(check("2026-11-01")).toBe("ok");
    expect(check("2026-11-02")).toBe("tooManyNights");
  });

  it("гости — целое от 1 до 30", () => {
    for (const guests of ["0", "31", "2.5", "abc", ""]) {
      const r = validateLead({ ...valid, guests }, TODAY);
      expect(!r.ok && r.errors).toEqual({ guests: "invalid" });
    }
    expect(validateLead({ ...valid, guests: "30" }, TODAY).ok).toBe(true);
  });

  it("длина имени и комментария", () => {
    const r = validateLead(
      { ...valid, name: "а".repeat(101), comment: "б".repeat(1001) },
      TODAY,
    );
    expect(!r.ok && r.errors).toEqual({ name: "tooLong", comment: "tooLong" });
  });
});
