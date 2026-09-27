import { deletePayment } from "@/app/admin/(panel)/places/payments";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { PAYMENT_KINDS } from "@/lib/payments/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentForm } from "./PaymentForm";
import { cardClass } from "./ui";

const tenge = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;
const date = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** Оплаты объекта (Этап 8): отметка «оплачено» с суммой и датой. */
export async function PaymentsSection({ placeId }: { placeId: string }) {
  const { data: payments, error } = await createAdminClient()
    .from("payments")
    .select("id, amount, kind, paid_at, comment")
    .eq("place_id", placeId)
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-medium">Оплаты</h2>
        {payments.length > 0 && (
          <span className="text-sm text-text-muted">Всего: {tenge(total)}</span>
        )}
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-text-muted">Оплат пока нет.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {tenge(p.amount)} · {PAYMENT_KINDS[p.kind]}
                </span>
                <span className="text-sm text-text-muted">
                  {date(p.paid_at)}
                  {p.comment && ` · ${p.comment}`}
                </span>
              </div>
              <form action={deletePayment.bind(null, p.id, placeId)}>
                <button
                  type="submit"
                  className="flex h-11 items-center px-2 text-sm text-text-muted"
                >
                  Удалить
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <PaymentForm
        placeId={placeId}
        today={toIsoDate(almatyToday(new Date()))}
      />
    </section>
  );
}
