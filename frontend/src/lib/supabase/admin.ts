import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { assertSupabaseEnv, SUPABASE_URL } from "./env";

/**
 * Клиент с секретным ключом — обходит RLS.
 * Использовать только на сервере и только после requireAdmin().
 */
export function createAdminClient() {
  assertSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error("Не задан SUPABASE_SECRET_KEY — см. docs/SETUP.md");

  return createClient<Database>(SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
