import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cardClass, secondaryButtonClass } from "@/components/admin/ui";
import { checkAdmin } from "@/lib/admin/auth";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Нет доступа" };

export default async function DeniedPage() {
  const check = await checkAdmin();
  if (check.status === "admin") redirect("/admin");
  if (check.status === "anonymous") redirect("/admin/login");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className={cardClass}>
        <h1 className="mb-2 font-serif text-2xl font-medium">Нет доступа</h1>
        <p className="mb-6 text-text-secondary">
          У аккаунта <b className="text-text">{check.email}</b> нет прав на
          админку.
        </p>
        <form action={signOut}>
          <button type="submit" className={secondaryButtonClass}>
            Выйти
          </button>
        </form>
      </div>
    </main>
  );
}
