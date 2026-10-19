import { Geologica, Unbounded } from "next/font/google";

// subsets — какие начертания грузить заранее (preload). Казахские буквы
// (ә, ғ, қ, ң, ө, ұ, ү, һ) лежат в cyrillic-ext: его @font-face тоже есть в CSS,
// но файл скачивается, только когда на странице есть эти буквы.
// Так русские страницы не тянут лишние шрифты (скорость на мобильном).

/** Весь интерфейс. */
export const geologica = Geologica({
  variable: "--font-geologica",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
});

/** Только крупные заголовки, цены и логотип: широкий, его мало. */
export const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500"],
});
