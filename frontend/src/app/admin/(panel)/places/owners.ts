import "server-only";
import { adminApi } from "@/lib/api/client";

export async function listOwners() {
  const owners =
    await adminApi<{ id: string; name: string }[]>("/admin/owners");
  return owners.map(({ id, name }) => ({ id, name }));
}
