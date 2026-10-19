import { describe, expect, it } from "vitest";
import { errorReport } from "./errorReport";

const context = { routePath: "/[locale]/place/[slug]", routeType: "render" };

describe("errorReport", () => {
  it("сообщение, digest и путь без строки запроса", () => {
    const error = Object.assign(new Error("API 500 /public/places"), {
      digest: "123",
    });
    const report = errorReport(
      error,
      { path: "/ru/place/x?guests=4&phone=+77010000000", method: "GET" },
      context,
    );
    expect(report).toMatchObject({
      message: "API 500 /public/places",
      digest: "123",
      path: "GET /ru/place/x",
      route: "render /[locale]/place/[slug]",
    });
    expect(report.stack).toContain("API 500");
  });

  it("не Error", () => {
    const report = errorReport("boom", { path: "/", method: "POST" }, context);
    expect(report.message).toBe("boom");
    expect(report.digest).toBeUndefined();
  });
});
