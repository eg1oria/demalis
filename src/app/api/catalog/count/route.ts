import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/catalog/filters";
import { findPlaces } from "@/lib/catalog/query";

/** Сколько вариантов найдётся по фильтрам (для кнопки «Показать N вариантов» на главной). */
export async function GET(request: Request) {
  const filters = parseFilters(new URL(request.url).searchParams);
  const { total } = await findPlaces(filters);
  return NextResponse.json(
    { count: total },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
