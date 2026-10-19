/**
 * Ошибка на сервере сайта → тело запроса POST /internal/errors бэкенда,
 * который шлёт её админу в Telegram (instrumentation.ts → onRequestError).
 */
export type ErrorReport = {
  message: string;
  digest?: string;
  stack?: string;
  path: string;
  route: string;
};

export function errorReport(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
): ErrorReport {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;
  return {
    message: error instanceof Error ? error.message : String(error),
    digest,
    stack: error instanceof Error ? error.stack : undefined,
    // Без строки запроса: в ней бывают персональные данные из фильтров и форм.
    path: `${request.method} ${request.path.split("?")[0]}`,
    route: `${context.routeType} ${context.routePath}`,
  };
}
