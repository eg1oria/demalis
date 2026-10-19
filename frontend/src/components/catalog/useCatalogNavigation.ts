"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { type CatalogFilters, catalogHref } from "@/lib/catalog/filters";

/** Переход на каталог с новыми фильтрами (адрес — единственный источник правды). */
export function useCatalogNavigation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (filters: CatalogFilters) =>
    startTransition(() => router.push(catalogHref(filters), { scroll: false }));

  return { apply, pending };
}
