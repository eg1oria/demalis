// Вход в админку без письма — только для разработки с локальным бэкендом.
// Локально письма уходят не на настоящую почту, а в Mailpit (docker-compose.yml).

/** Почтовый ящик для разработки (порт из docker-compose.yml, сервис mailpit). */
export const LOCAL_MAILBOX_URL = "http://127.0.0.1:8025";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * Разрешён ли вход без письма: не production-сборка и бэкенд на этом
 * компьютере. На сервере с настоящим бэкендом всегда false (бэкенд
 * в production тоже отклоняет такой вход).
 */
export function isDevLoginAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  try {
    const { hostname } = new URL(env.API_URL ?? "");
    return LOCAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
