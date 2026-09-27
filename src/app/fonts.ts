import { Literata, Onest } from "next/font/google";

export const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600"],
});

export const literata = Literata({
  variable: "--font-literata",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["500", "600"],
});
