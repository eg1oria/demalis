import Link from "next/link";
import { LogoMark } from "@/components/site/Icons";
import { SITE_NAME } from "@/config/site";
import { requireAdminPage } from "@/lib/admin/auth";
import { signOut } from "../actions";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const email = await requireAdminPage();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-display text-base font-medium tracking-[-0.03em]"
          >
            <LogoMark size={22} />
            {SITE_NAME} · админка
          </Link>
          <nav className="order-last flex w-full flex-wrap gap-x-1 text-sm sm:order-none sm:w-auto sm:flex-1">
            <Link
              href="/admin"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Объекты
            </Link>
            <Link
              href="/admin/collections"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Подборки
            </Link>
            <Link
              href="/admin/holidays"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Праздники
            </Link>
            <Link
              href="/admin/owners"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Владельцы
            </Link>
            <Link
              href="/admin/leads"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Заявки
            </Link>
            <Link
              href="/admin/reviews"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Отзывы
            </Link>
            <Link
              href="/admin/groups"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Подбор
            </Link>
            <Link
              href="/admin/stats"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Статистика
            </Link>
            <Link
              href="/admin/billing"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Оплаты
            </Link>
            <Link
              href="/admin/import"
              className="flex h-11 items-center px-2 whitespace-nowrap"
            >
              Импорт CSV
            </Link>
          </nav>
          <form
            action={signOut}
            className="ml-auto flex items-center gap-2 text-sm text-text-muted sm:ml-0"
          >
            <span className="hidden sm:inline">{email}</span>
            <button
              type="submit"
              className="flex h-11 items-center px-2 text-text"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
