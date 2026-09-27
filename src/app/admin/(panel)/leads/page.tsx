import type { Metadata } from "next";
import Link from "next/link";
import { LeadBillableToggle } from "@/components/admin/LeadBillableToggle";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { TIME_ZONE } from "@/config/site";
import { requireAdminPage } from "@/lib/admin/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Заявки" };

const LIMIT = 200;

const createdFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const formatDate = (iso: string | null) =>
  iso ? dateFormat.format(new Date(`${iso}T00:00:00Z`)) : "—";

export default async function LeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  await requireAdminPage();
  const params = await searchParams;
  const status =
    typeof params.status === "string" && params.status in LEAD_STATUSES
      ? (params.status as LeadStatus)
      : null;

  let query = createAdminClient()
    .from("leads")
    .select(
      "id, name, phone, date_from, date_to, guests, comment, status, billable, created_at, place:places (id, name_ru)",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (status) query = query.eq("status", status);

  const { data: leads, error } = await query;
  if (error) throw error;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Заявки</h1>

      <form className="flex flex-col gap-2 sm:flex-row">
        <select
          name="status"
          defaultValue={status ?? ""}
          className={`${inputClass} sm:w-64`}
        >
          <option value="">Все статусы</option>
          {Object.entries(LEAD_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Показать
        </button>
      </form>

      <p className="text-sm text-text-muted">
        Найдено: {leads.length}
        {leads.length === LIMIT && ` (последние ${LIMIT})`}
      </p>

      <ul className="flex flex-col gap-2">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="flex flex-col gap-3 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-start"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-text-muted">
                {createdFormat.format(new Date(lead.created_at))}
                {lead.place && (
                  <>
                    {" · "}
                    <Link
                      href={`/admin/places/${lead.place.id}`}
                      className="text-text-secondary hover:underline"
                    >
                      {lead.place.name_ru}
                    </Link>
                  </>
                )}
              </span>
              <span className="font-medium">
                {lead.name} ·{" "}
                <a href={`tel:${lead.phone}`} className="text-accent">
                  {lead.phone}
                </a>
              </span>
              <span className="text-sm text-text-secondary">
                {formatDate(lead.date_from)} – {formatDate(lead.date_to)}
                {lead.guests != null && ` · гостей: ${lead.guests}`}
              </span>
              {lead.comment && (
                <p className="text-sm break-words whitespace-pre-line text-text-secondary">
                  {lead.comment}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <LeadStatusSelect id={lead.id} status={lead.status} />
              <LeadBillableToggle id={lead.id} billable={lead.billable} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
