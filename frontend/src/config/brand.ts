// Знак «демалыс»: домик A-frame на ножках — он же кириллическая «д»,
// первая буква названия, и солнце у конька. Сетка 32×32.
// Те же фигуры — в src/app/icon.svg и design/brand/*.svg (там нельзя импортировать).

/** Домик с дверью-щелью, основание и ножки «д». Заливка evenodd. */
export const MARK_PATH =
  "M16 3 28 20.5H4ZM16 12.5 12.8 20.5H19.2ZM2.5 20.5h27v3h-27ZM2.5 23.5h3v4h-3ZM26.5 23.5h3v4h-3Z";

/** Солнце — единственное цветное пятно знака. */
export const MARK_SUN = { cx: 26, cy: 6, r: 3 } as const;

export const BRAND_COLORS = {
  ink: "#111111",
  paper: "#fafaf8",
  sun: "#d9a441",
} as const;
