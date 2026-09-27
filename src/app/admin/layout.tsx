import type { Metadata } from "next";
import { SITE_NAME } from "@/config/site";
import { literata, onest } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: `Админка — ${SITE_NAME}`,
    template: `%s — админка ${SITE_NAME}`,
  },
  robots: { index: false, follow: false },
};

// Админка не локализована: только русский.
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
