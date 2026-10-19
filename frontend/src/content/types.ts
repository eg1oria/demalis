/**
 * Раздел юридической страницы (политика, соглашение, оферта, «О нас»).
 * Подстановки {site}, {operator}, {bin}, {email}… берутся из src/config/legal.ts.
 */
export type LegalSection = {
  title: string;
  paragraphs: string[];
  /** Список после абзацев. */
  items?: string[];
};
