import { landscapeVariant } from "@/lib/places/present";

// Спокойный пейзаж-заглушка вместо фото (design/README.md, п. 3).
// Палитры взяты из макета, это иллюстрация, а не цвета интерфейса.
// prettier-ignore
const PALETTES = [
  { sky: "#E4E7DD", sun: "#F4F2EA", far: "#B8C3AD", near: "#7F9678", ground: "#405C46", hut: "#23302A", window: "#F2D08A", sunX: 96 },
  { sky: "#EFE3D3", sun: "#F8EFE1", far: "#CDB79C", near: "#8E8468", ground: "#56604A", hut: "#2A2A24", window: "#F4C977", sunX: 120 },
  { sky: "#DCE5E4", sun: "#F3F5F0", far: "#AFC2C3", near: "#6F8E8F", ground: "#3F5C5D", hut: "#22302F", window: "#F2D08A", sunX: 320 },
  { sky: "#F2E6D8", sun: "#FBF4EB", far: "#DDB899", near: "#B8805E", ground: "#7B4B35", hut: "#2D211B", window: "#F4C977", sunX: 330 },
] as const;

export function Landscape({
  seed,
  hut = true,
}: {
  seed: string;
  hut?: boolean;
}) {
  const p = PALETTES[landscapeVariant(seed, PALETTES.length)];
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <rect width="400" height="300" fill={p.sky} />
      <circle cx={p.sunX} cy="76" r="20" fill={p.sun} />
      <path
        d="M0 172 L58 122 L112 152 L172 84 L232 142 L292 100 L352 136 L400 112 L400 300 L0 300 Z"
        fill={p.far}
      />
      <path
        d="M0 216 L72 168 L132 206 L202 150 L272 202 L332 174 L400 206 L400 300 L0 300 Z"
        fill={p.near}
      />
      <path d="M0 252 Q200 230 400 252 L400 300 L0 300 Z" fill={p.ground} />
      {hut && (
        <>
          <path d="M252 262 L278 208 L304 262 Z" fill={p.hut} />
          <path d="M273 262 L273 244 L283 244 L283 262 Z" fill={p.window} />
        </>
      )}
    </svg>
  );
}
