import { fillLegal } from "@/config/legal";
import { SITE_NAME } from "@/config/site";
import type { LegalSection } from "@/content/types";

/** Подстановки страницы ({price_pro} и т. п.), затем реквизиты из LEGAL. */
function fill(text: string, vars: Record<string, string>): string {
  const withVars = Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    text,
  );
  return fillLegal(withVars, SITE_NAME);
}

/** Текстовая страница: заголовок, дата редакции, разделы с абзацами и списками. */
export function LegalDocument({
  title,
  subtitle,
  sections,
  vars = {},
}: {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
  vars?: Record<string, string>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-4 md:pt-16">
      <h1 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.04em] break-words hyphens-auto md:text-[40px]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-sm text-text-muted">{subtitle}</p>}
      {sections.map((section) => (
        <section
          key={section.title}
          className="mt-10 border-t border-line pt-8"
        >
          <h2 className="font-display text-lg font-medium tracking-[-0.03em] md:text-xl">
            {section.title}
          </h2>
          {section.paragraphs.map((p) => (
            <p
              key={p}
              className="mt-3 text-[15px] leading-relaxed text-text-secondary"
            >
              {fill(p, vars)}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed text-text-secondary">
              {section.items.map((item) => (
                <li key={item}>{fill(item, vars)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
