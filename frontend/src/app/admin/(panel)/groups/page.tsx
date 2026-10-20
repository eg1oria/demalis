import type { Metadata } from "next";
import { GroupRequestControls } from "@/components/admin/GroupRequestControls";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { TIME_ZONE } from "@/config/site";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminApi, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";
import {
  AMENITY_FILTERS,
  type AmenityFilter,
  catalogHref,
  MAX_GUESTS,
  rangeWhen,
} from "@/lib/catalog/filters";
import {
  GROUP_OCCASIONS,
  GROUP_STATUSES,
  type GroupStatus,
} from "@/lib/groups/validate";
import { AMENITIES, type Amenity, DIRECTIONS } from "@/lib/places/constants";

export const metadata: Metadata = { title: "Подбор" };

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

const formatDate = (iso: string) =>
  dateFormat.format(new Date(`${iso}T00:00:00Z`));

const tenge = new Intl.NumberFormat("ru-RU");

/** Поле в базе → ключ фильтра каталога (баня → banya). */
const FILTER_BY_AMENITY = Object.fromEntries(
  Object.entries(AMENITY_FILTERS).map(([key, field]) => [field, key]),
) as Partial<Record<Amenity, AmenityFilter>>;

/** Каталог с теми же пожеланиями — чтобы быстро найти варианты. */
function catalogLink(request: Tables<"group_requests">): string {
  const when =
    request.date_from && request.date_to
      ? rangeWhen(request.date_from, request.date_to)
      : undefined;
  return `/ru${catalogHref({
    guests: Math.min(request.guests, MAX_GUESTS),
    amenities: request.amenities.flatMap((a) => {
      const key = FILTER_BY_AMENITY[a as Amenity];
      return key ? [key] : [];
    }),
    dir: request.direction ?? undefined,
    when,
    all: true,
  })}`;
}

/** «Подберём за вас»: заявки компаний от 15 человек. */
export default async function GroupsPage({
  searchParams,
}: PageProps<"/admin/groups">) {
  await requireAdminPage();
  const params = await searchParams;
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(GROUP_STATUSES, params.status)
      ? (params.status as GroupStatus)
      : null;

  const requests = await adminApi<Tables<"group_requests">[]>(
    `/admin/group-requests${query({ status, limit: LIMIT })}`,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        Подбор для компаний
      </h1>

      <form className="flex flex-col gap-2 sm:flex-row">
        <select
          name="status"
          defaultValue={status ?? ""}
          className={`${inputClass} sm:w-64`}
        >
          <option value="">Все статусы</option>
          {Object.entries(GROUP_STATUSES).map(([value, label]) => (
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
        Найдено: {requests.length}
        {requests.length === LIMIT && ` (последние ${LIMIT})`}
      </p>

      <ul className="flex flex-col gap-2">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-3 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-start"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-text-muted">
                {createdFormat.format(new Date(request.created_at))}
              </span>
              <span className="font-medium">
                {GROUP_OCCASIONS[request.occasion]} · {request.guests} чел.
              </span>
              <span className="text-sm">
                {request.name} ·{" "}
                <a href={`tel:${request.phone}`} className="text-accent">
                  {request.phone}
                </a>
                {" · "}
                <a
                  href={`https://wa.me/${request.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="text-accent"
                >
                  WhatsApp
                </a>
              </span>
              <span className="text-sm text-text-secondary">
                {request.date_from && request.date_to
                  ? `${formatDate(request.date_from)} – ${formatDate(request.date_to)}`
                  : "Даты не решили"}
                {request.budget != null &&
                  ` · бюджет ${tenge.format(request.budget)} ₸`}
                {` · ${request.direction ? DIRECTIONS[request.direction] : "любое направление"}`}
              </span>
              {request.amenities.length > 0 && (
                <span className="text-sm text-text-secondary">
                  Нужно:{" "}
                  {request.amenities
                    .map((a) => AMENITIES[a as Amenity] ?? a)
                    .join(", ")}
                </span>
              )}
              {request.comment && (
                <p className="text-sm break-words whitespace-pre-line text-text-secondary">
                  {request.comment}
                </p>
              )}
              <a
                href={catalogLink(request)}
                target="_blank"
                rel="noopener"
                className="w-fit text-sm text-accent hover:underline"
              >
                Каталог с этими пожеланиями →
              </a>
            </div>
            <GroupRequestControls
              id={request.id}
              status={request.status}
              note={request.admin_note}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
