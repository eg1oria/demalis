import { useTranslations } from "next-intl";
import type { DisplayStatus } from "@/lib/availability";

/** Цветная точка статуса (раздел 7.3): у «неизвестно» — пустой кружок с обводкой. */
export function StatusDot({
  status,
  size = 8,
}: {
  status: DisplayStatus;
  size?: number;
}) {
  const known = status === "free" || status === "limited" || status === "full";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`flex-none rounded-full ${
        known
          ? {
              free: "bg-status-free",
              limited: "bg-status-limited",
              full: "bg-status-full",
            }[status]
          : "border-[1.5px] border-status-full"
      }`}
    />
  );
}

/** Белая «таблетка» с точкой на фото карточки. */
export function StatusBadge({ status }: { status: DisplayStatus }) {
  const t = useTranslations("Status");
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[13px] font-semibold whitespace-nowrap text-text">
      <StatusDot status={status} />
      {t(status)}
    </span>
  );
}
