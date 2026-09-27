"use client";

import type { ReactNode } from "react";
import { goHref } from "@/lib/go";

/**
 * Звонок — обычная ссылка tel: (перенаправление на tel: работает не во всех
 * браузерах), а клик уходит на сервер фоном.
 */
export function TrackedPhoneLink({
  placeId,
  phone,
  className,
  children,
}: {
  placeId: string;
  phone: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`tel:${phone}`}
      className={className}
      onClick={() => navigator.sendBeacon?.(goHref("phone", placeId))}
    >
      {children}
    </a>
  );
}
