// Вход в админку без письма — только для разработки на локальном Supabase.
// Локальный Supabase не отправляет настоящие письма: они попадают в Mailpit.

/** Почтовый ящик локального Supabase (порт из supabase/config.toml, [inbucket]). */
export const LOCAL_MAILBOX_URL = "http://127.0.0.1:54324";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * Разрешён ли вход без письма: не production-сборка и Supabase на этом
 * компьютере. На Vercel и с облачным Supabase всегда false.
 */
export function isDevLoginAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  try {
    const { hostname } = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return LOCAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
