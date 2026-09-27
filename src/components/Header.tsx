import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl font-semibold text-accent">
          {SITE_NAME}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
