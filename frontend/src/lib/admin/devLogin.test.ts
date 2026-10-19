import { describe, expect, it } from "vitest";
import { isDevLoginAllowed } from "./devLogin";

describe("вход без письма", () => {
  it("разрешён при разработке с локальным бэкендом", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        API_URL: "http://127.0.0.1:4000",
      }),
    ).toBe(true);
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        API_URL: "http://localhost:4000",
      }),
    ).toBe(true);
  });

  it("запрещён в production, даже с локальным бэкендом", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "production",
        API_URL: "http://127.0.0.1:4000",
      }),
    ).toBe(false);
  });

  it("запрещён с бэкендом на сервере", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        API_URL: "https://api.demalys.kz",
      }),
    ).toBe(false);
  });

  it("запрещён без адреса или с мусором", () => {
    expect(isDevLoginAllowed({ NODE_ENV: "development" })).toBe(false);
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        API_URL: "не адрес",
      }),
    ).toBe(false);
  });
});
