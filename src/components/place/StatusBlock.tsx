import type { DisplayStatus } from "@/lib/availability";

const STYLES: Record<
  DisplayStatus,
  { box: string; title: string; text: string }
> = {
  free: {
    box: "bg-status-free-bg",
    title: "text-status-block-title",
    text: "text-status-block-text",
  },
  limited: {
    box: "bg-status-limited-bg",
    title: "text-status-limited-text",
    text: "text-status-limited-text",
  },
  full: {
    box: "bg-status-full-bg",
    title: "text-text-secondary",
    text: "text-text-muted",
  },
  stale: {
    box: "border border-dashed border-status-unknown-border",
    title: "text-text",
    text: "text-text-muted",
  },
  unknown: {
    box: "border border-dashed border-status-unknown-border",
    title: "text-text",
    text: "text-text-muted",
  },
};

/** «Свободно в эту субботу» — главный ответ на странице объекта. */
export function StatusBlock({
  status,
  title,
  subtitle,
}: {
  status: DisplayStatus;
  title: string;
  subtitle: string;
}) {
  const style = STYLES[status];
  return (
    <div
      className={`flex items-center gap-3.5 rounded-[18px] p-4 ${style.box}`}
    >
      <span
        className={`flex size-10 flex-none items-center justify-center rounded-full bg-white ${
          status === "free" ? "text-status-block-icon" : "text-text-muted"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {status === "free" || status === "limited" ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : status === "full" ? (
            <path d="M7 7l10 10M17 7L7 17" />
          ) : (
            <>
              <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2" />
              <circle cx="12" cy="17" r="0.6" />
            </>
          )}
        </svg>
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={`text-base font-semibold ${style.title}`}>
          {title}
        </span>
        <span className={`text-[13px] ${style.text}`}>{subtitle}</span>
      </div>
    </div>
  );
}
