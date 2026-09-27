import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/** Чипс-фильтр: выключен — белый с рамкой line, включён — фон text и белый текст. */
export function chipClass(active: boolean) {
  return `flex h-11 flex-none items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap ${
    active
      ? "border-text bg-text text-white"
      : "border-line bg-surface text-text"
  }`;
}

export function ChipLink({
  active = false,
  ...props
}: ComponentProps<typeof Link> & { active?: boolean }) {
  return (
    <Link
      {...props}
      aria-current={active || undefined}
      className={chipClass(active)}
    />
  );
}
