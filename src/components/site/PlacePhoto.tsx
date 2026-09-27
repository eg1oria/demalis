import Image from "next/image";
import { photoUrl } from "@/lib/supabase/env";
import { Landscape } from "./Landscape";

/** Фото объекта через next/image или пейзаж-заглушка, если фото нет. */
export function PlacePhoto({
  path,
  seed,
  alt,
  sizes,
  priority = false,
}: {
  path: string | undefined;
  seed: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!path) return <Landscape seed={seed} />;
  return (
    <Image
      src={photoUrl(path)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}
