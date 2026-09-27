import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./emails";

describe("ADMIN_EMAILS", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("разбирает список через запятую с пробелами", () => {
    expect(parseAdminEmails(" A@x.kz, b@y.kz ,,")).toEqual(
      new Set(["a@x.kz", "b@y.kz"]),
    );
  });

  it("пускает только email из списка, без учёта регистра", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@demalys.kz");
    expect(isAdminEmail("Admin@Demalys.kz")).toBe(true);
    expect(isAdminEmail("hacker@demalys.kz")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("пустой ADMIN_EMAILS — никого не пускает", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdminEmail("admin@demalys.kz")).toBe(false);
  });
});
