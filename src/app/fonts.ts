import { Literata, Onest } from "next/font/google";

// subsets — какие начертания грузить заранее (preload). Казахские буквы
// (ә, ғ, қ, ң, ө, ұ, ү, һ) лежат в cyrillic-ext: его @font-face тоже есть в CSS,
// но файл скачивается, только когда на странице есть эти буквы.
// Так русские страницы не тянут лишние шрифты (скорость на мобильном).

export const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
});

export const literata = Literata({
  variable: "--font-literata",
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600"],
});
