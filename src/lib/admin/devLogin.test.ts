import { describe, expect, it } from "vitest";
import { isDevLoginAllowed } from "./devLogin";

describe("вход без письма", () => {
  it("разрешён при разработке на локальном Supabase", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toBe(true);
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      }),
    ).toBe(true);
  });

  it("запрещён в production, даже с локальным Supabase", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toBe(false);
  });

  it("запрещён с облачным Supabase", () => {
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
      }),
    ).toBe(false);
  });

  it("запрещён без адреса или с мусором", () => {
    expect(isDevLoginAllowed({ NODE_ENV: "development" })).toBe(false);
    expect(
      isDevLoginAllowed({
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "не адрес",
      }),
    ).toBe(false);
  });
});
