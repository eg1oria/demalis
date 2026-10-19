import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Админка и служебные адреса (клики, заявки, бот) — не для поиска.
        disallow: ["/admin", "/api/"],
      },
      {
        // Робот Google Ads проверяет посадочные страницы и переходы по кнопкам
        // (/api/go → WhatsApp). Правило «*» он не читает — ему своё, явное.
        userAgent: ["AdsBot-Google", "AdsBot-Google-Mobile"],
        allow: "/",
        disallow: ["/admin"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
