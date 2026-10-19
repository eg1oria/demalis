import Image from "next/image";
import { photoUrl } from "@/lib/api/photos";
import { Landscape } from "./Landscape";

/** Фото объекта через next/image или заглушка, если фото нет. */
export function PlacePhoto({
  path,
  alt,
  sizes,
  priority = false,
}: {
  path: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!path) return <Landscape />;
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
