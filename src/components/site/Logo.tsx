import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "./Icons";

export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2 text-text">
      <LogoMark size={size === "md" ? 26 : 22} />
      <span
        className={`font-display font-medium tracking-[-0.03em] lowercase ${size === "md" ? "text-[19px]" : "text-[16px]"}`}
      >
        {SITE_NAME}
      </span>
    </Link>
  );
}
