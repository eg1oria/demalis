import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import {
  assertSupabaseEnv,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./env";

/**
 * Анонимный клиент для публичных страниц: без cookie, работает RLS
 * (видны только опубликованные объекты).
 */
export function createPublicClient() {
  assertSupabaseEnv();
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
