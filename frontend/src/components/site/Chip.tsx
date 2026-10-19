import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/** Чипс-фильтр: выключен — контур line, включён — фон text и белый текст. */
export function chipClass(active: boolean) {
  return `flex h-10 flex-none items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
    active
      ? "border-text bg-text text-white"
      : "border-line text-text hover:border-text"
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
