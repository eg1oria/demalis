import { ImageResponse } from "next/og";
import { BRAND_COLORS, MARK_PATH, MARK_SUN } from "@/config/brand";
import { SITE_NAME } from "@/config/site";

// Заставка для соцсетей у страниц без своих фото (главная, каталог, подборки).
// Отдельный маршрут, а не opengraph-image: файловая заставка перебила бы
// фото объектов на их страницах.

export const dynamic = "force-static";

const SIZE = { width: 1200, height: 630 };
const TAGLINE = "Загородный отдых на выходные вокруг Алматы";

/**
 * Unbounded с Google Fonts только для нужных букв. Без User-Agent Google
 * отдаёт TTF — его понимает next/og. Нет сети — заставка без текста.
 */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Unbounded:wght@500&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET() {
  const name = SITE_NAME.toLowerCase();
  const font = await loadFont(`${name}${TAGLINE}`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: BRAND_COLORS.paper,
        color: BRAND_COLORS.ink,
        fontFamily: "Unbounded",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 32 32">
          <path d={MARK_PATH} fill={BRAND_COLORS.ink} fillRule="evenodd" />
          <circle {...MARK_SUN} fill={BRAND_COLORS.sun} />
        </svg>
        {font && (
          <span style={{ fontSize: 56, letterSpacing: -2 }}>{name}</span>
        )}
      </div>
      {font && (
        <div
          style={{
            display: "flex",
            maxWidth: 900,
            fontSize: 64,
            lineHeight: 1.08,
            letterSpacing: -3,
          }}
        >
          {TAGLINE}
        </div>
      )}
      <div
        style={{ display: "flex", height: 2, background: BRAND_COLORS.ink }}
      />
    </div>,
    {
      ...SIZE,
      fonts: font
        ? [{ name: "Unbounded", data: font, weight: 500, style: "normal" }]
        : undefined,
    },
  );
}
