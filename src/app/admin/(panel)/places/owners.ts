import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listOwners() {
  const { data, error } = await createAdminClient()
    .from("owners")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data;
}
