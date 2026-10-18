import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "./Icons";

/** Заголовок раздела страницы; справа — необязательная ссылка «Все →». */
export function SectionTitle({
  children,
  href,
  linkLabel,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <Tag className="font-display text-[22px] leading-[1.15] font-medium tracking-[-0.03em] md:text-[30px]">
        {children}
      </Tag>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex h-9 flex-none items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text"
        >
          {linkLabel}
          <ArrowRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
