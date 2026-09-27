import type { Metadata } from "next";
import Link from "next/link";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  almatyToday,
  monthRange,
  parseMonth,
  shiftMonth,
  toIsoDate,
} from "@/lib/dates";
import { PAYMENT_KINDS, type PaymentKind } from "@/lib/payments/validate";
import { effectivePlan, isFeatured } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Оплаты" };

const tenge = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

/**
 * Отчёт за месяц (Этап 8): платные заявки по объектам и принятые оплаты.
 * Деньги принимаются вручную — здесь только учёт.
 */
export default async function BillingPage({
  searchParams,
}: PageProps<"/admin/billing">) {
  await requireAdminPage();
  const now = new Date();
  const today = toIsoDate(almatyToday(now));
  const month = parseMonth((await searchParams).month, now);
  const { from, to } = monthRange(month);
  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(
    "ru-RU",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const supabase = createAdminClient();
  const [leads, payments, places] = await Promise.all([
    supabase
      .from("leads")
      .select("place_id, billable")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString()),
    supabase
      .from("payments")
      .select("id, place_id, amount, kind, paid_at, comment")
      .gte("paid_at", `${month}-01`)
      .lt("paid_at", `${shiftMonth(month, 1)}-01`)
      .order("paid_at"),
    supabase
      .from("places")
      .select("id, name_ru, plan, pro_until, featured_until"),
  ]);
  if (leads.error) throw leads.error;
  if (payments.error) throw payments.error;
  if (places.error) throw places.error;

  const placeById = new Map(places.data.map((p) => [p.id, p]));
  const byPlace = new Map<string, { total: number; billable: number }>();
  for (const lead of leads.data) {
    const row = byPlace.get(lead.place_id) ?? { total: 0, billable: 0 };
    row.total++;
    if (lead.billable) row.billable++;
    byPlace.set(lead.place_id, row);
  }
  const rows = [...byPlace.entries()]
    .map(([placeId, counts]) => ({
      place: placeById.get(placeId),
      placeId,
      ...counts,
    }))
    .sort(
      (a, b) =>
        b.billable - a.billable ||
        b.total - a.total ||
        (a.place?.name_ru ?? "").localeCompare(b.place?.name_ru ?? "", "ru"),
    );
  const billableTotal = rows.reduce((s, r) => s + r.billable, 0);

  const sumByKind = new Map<PaymentKind, number>();
  for (const p of payments.data)
    sumByKind.set(p.kind, (sumByKind.get(p.kind) ?? 0) + p.amount);
  const paymentsTotal = payments.data.reduce((s, p) => s + p.amount, 0);

  const proNow = places.data.filter((p) => effectivePlan(p, today) === "pro");
  const featuredNow = places.data.filter((p) => isFeatured(p, today));

  const cardClass = "rounded-[14px] border border-line-soft bg-surface p-3";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-serif text-2xl font-medium">Оплаты</h1>

      <form className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/billing?month=${shiftMonth(month, -1)}`}
          className={secondaryButtonClass}
          aria-label="Предыдущий месяц"
        >
          ←
        </Link>
        <input
          type="month"
          name="month"
          defaultValue={month}
          className={`${inputClass} w-44`}
        />
        <button type="submit" className={secondaryButtonClass}>
          Показать
        </button>
        <Link
          href={`/admin/billing?month=${shiftMonth(month, 1)}`}
          className={secondaryButtonClass}
          aria-label="Следующий месяц"
        >
          →
        </Link>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">
          Платные заявки · {monthLabel}
        </h2>
        <p className="text-sm text-text-muted">
          Отметка «Платная заявка» ставится в списке заявок. Всего платных:{" "}
          {billableTotal}.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-text-muted">Заявок за месяц нет.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.placeId}
                className={`${cardClass} flex flex-wrap items-center justify-between gap-2`}
              >
                <Link
                  href={`/admin/places/${row.placeId}`}
                  className="font-medium hover:underline"
                >
                  {row.place?.name_ru ?? "Удалённый объект"}
                </Link>
                <span className="text-sm tabular-nums">
                  платных: <b>{row.billable}</b>{" "}
                  <span className="text-text-muted">из {row.total}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">
          Принятые оплаты · {monthLabel}
        </h2>
        <p className="text-sm text-text-muted">
          Итого: {tenge(paymentsTotal)}
          {[...sumByKind.entries()]
            .map(([kind, sum]) => ` · ${PAYMENT_KINDS[kind]}: ${tenge(sum)}`)
            .join("")}
          . Отмечаются в карточке объекта, блок «Оплаты».
        </p>
        {payments.data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {payments.data.map((p) => (
              <li key={p.id} className={`${cardClass} flex flex-col`}>
                <span className="font-medium">
                  {tenge(p.amount)} · {PAYMENT_KINDS[p.kind]}
                </span>
                <span className="text-sm text-text-muted">
                  {p.paid_at.split("-").reverse().join(".")} ·{" "}
                  <Link
                    href={`/admin/places/${p.place_id}`}
                    className="hover:underline"
                  >
                    {placeById.get(p.place_id)?.name_ru}
                  </Link>
                  {p.comment && ` · ${p.comment}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">Сейчас действует</h2>
        <p className="text-sm text-text-secondary">
          Pro: {proNow.length}
          {proNow.length > 0 &&
            ` — ${proNow.map((p) => `${p.name_ru}${p.pro_until ? ` (до ${p.pro_until.split("-").reverse().join(".")})` : ""}`).join(", ")}`}
        </p>
        <p className="text-sm text-text-secondary">
          Продвижение: {featuredNow.length}
          {featuredNow.length > 0 &&
            ` — ${featuredNow.map((p) => `${p.name_ru} (до ${p.featured_until!.split("-").reverse().join(".")})`).join(", ")}`}
        </p>
      </section>
    </div>
  );
}
