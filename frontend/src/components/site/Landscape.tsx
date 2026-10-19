import { MountainsIcon } from "./Icons";

/** Заглушка вместо фото: ровный фон и тонкая линия гор по центру. */
export function Landscape({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-surface-muted text-line-strong"
    >
      <MountainsIcon size={small ? 28 : 44} />
    </span>
  );
}
