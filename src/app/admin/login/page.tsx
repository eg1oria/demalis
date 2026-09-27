import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cardClass } from "@/components/admin/ui";
import { SITE_NAME } from "@/config/site";
import { checkAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  if ((await checkAdmin()).status === "admin") redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className={cardClass}>
        <h1 className="mb-1 font-serif text-2xl font-medium">{SITE_NAME}</h1>
        <p className="mb-6 text-text-muted">
          Вход в админку по ссылке на email
        </p>
        <LoginForm linkError={error === "link"} />
      </div>
    </main>
  );
}
