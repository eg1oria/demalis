import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "./Icons";

export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2 text-text">
      <LogoMark size={size === "md" ? 28 : 22} />
      <span
        className={`font-serif font-semibold tracking-[-0.02em] lowercase ${size === "md" ? "text-[23px]" : "text-[19px]"}`}
      >
        {SITE_NAME}
      </span>
    </Link>
  );
}
