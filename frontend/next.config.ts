import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseUrl = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
);
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(
  supabaseUrl.hostname,
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Локальный Supabase живёт на 127.0.0.1 — без этого next/image его не пустит.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
