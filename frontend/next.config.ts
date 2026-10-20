import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Бэкенд (NestJS): фото объектов лежат у него в uploads/.
// Адрес вшивается при сборке; в Docker — http://backend:4000 (docker-compose.prod.yml).
const apiUrl = (process.env.API_URL || "http://127.0.0.1:4000").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  // Для Docker на сервере (frontend/Dockerfile): сервер и нужные модули в .next/standalone.
  output: "standalone",
  reactCompiler: true,
  images: {
    formats: ["image/webp"],
  },
  async rewrites() {
    // Фото объектов открываются с домена сайта, а отдаёт их бэкенд.
    return [
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
