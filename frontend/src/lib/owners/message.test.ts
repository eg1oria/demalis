import { describe, expect, it } from "vitest";
import { ownerRequestTelegramMessage } from "./message";

describe("ownerRequestTelegramMessage", () => {
  const request = {
    name: "Дом <у реки> & баня",
    phone: "+77011234567",
    instagram_url: "https://www.instagram.com/dom/",
    direction: "talgar" as const,
    type: "house" as const,
  };

  it("все поля, HTML экранирован", () => {
    expect(
      ownerRequestTelegramMessage(request, "https://x.kz/admin/places/1"),
    ).toBe(
      [
        "<b>Новый объект от владельца</b> — Дом &lt;у реки&gt; &amp; баня",
        "Дом · Талгар",
        "Телефон: +77011234567",
        "Instagram: https://www.instagram.com/dom/",
        "Согласие на фото и данные: да",
        "Статус: черновик",
        "",
        '<a href="https://x.kz/admin/places/1">Открыть в админке</a>',
      ].join("\n"),
    );
  });

  it("без Instagram и ссылки", () => {
    const text = ownerRequestTelegramMessage(
      { ...request, instagram_url: null },
      null,
    );
    expect(text).not.toContain("Instagram");
    expect(text).not.toContain("<a ");
  });
});
