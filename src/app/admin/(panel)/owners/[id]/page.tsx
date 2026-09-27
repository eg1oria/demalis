import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OwnerForm } from "@/components/admin/OwnerForm";
import {
  cardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { PLACE_STATUSES } from "@/lib/places/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotUsername } from "@/lib/telegram/api";
import { ownerReport } from "@/lib/bot/monthly";
import { parseMonth, shiftMonth } from "@/lib/dates";
import { createLinkCode, sendReportNow, unlinkTelegram } from "../actions";

export const metadata: Metadata = { title: "Владелец" };

const UUID = /^[0-9a-f-]{36}$/i;

const REPORT_RESULTS = {
  sent: "Отчёт отправлен владельцу в Telegram",
  "no-chat": "Бот у владельца не подключён — отправить некуда",
  "no-places": "У владельца нет объектов",
  "no-bot": "Не задан TELEGRAM_BOT_TOKEN",
} as const;

export default async function OwnerPage({
  params,
  searchParams,
}: PageProps<"/admin/owners/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const { saved, month, report: sentResult } = await searchParams;
  if (!UUID.test(id)) notFound();

  const { data: owner, error } = await createAdminClient()
    .from("owners")
    .select(
      "id, name, phone, telegram_chat_id, link_code, language, places (id, name_ru, status)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!owner) notFound();

  const username = owner.link_code ? await getBotUsername() : null;
  // Предпросмотр отчёта: по умолчанию — за прошлый месяц.
  const now = new Date();
  const reportMonth =
    typeof month === "string"
      ? parseMonth(month, now)
      : shiftMonth(parseMonth(undefined, now), -1);
  const { report } = await ownerReport(owner.id, reportMonth);
  const reportResult =
    typeof sentResult === "string" && sentResult in REPORT_RESULTS
      ? (sentResult as keyof typeof REPORT_RESULTS)
      : null;
  const deepLink =
    username && owner.link_code
      ? `https://t.me/${username}?start=${owner.link_code}`
      : null;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/owners" className="text-sm text-text-muted">
        ← Все владельцы
      </Link>
      <h1 className="font-serif text-2xl font-medium">{owner.name}</h1>
      {saved && (
        <p
          role="status"
          className="rounded-[14px] bg-status-free-bg p-3 text-status-free-text"
        >
          Сохранено
        </p>
      )}

      <section className={`${cardClass} flex flex-col gap-3`}>
        <h2 className="font-serif text-xl font-medium">Telegram-бот</h2>
        {owner.telegram_chat_id ? (
          <p className="text-sm text-text-secondary">
            Бот подключён
            {owner.language &&
              ` · язык: ${owner.language === "kk" ? "казахский" : "русский"}`}
            . Владелец получает заявки и напоминания.
          </p>
        ) : (
          <p className="text-sm text-text-secondary">Бот не подключён.</p>
        )}

        {owner.link_code && (
          <div className="flex flex-col gap-2 rounded-[14px] bg-surface-muted p-3">
            <span className="text-sm text-text-muted">
              Одноразовый код привязки
            </span>
            <span className="font-mono text-2xl font-semibold tracking-widest select-all">
              {owner.link_code}
            </span>
            <p className="text-sm text-text-secondary">
              Отправьте владельцу:{" "}
              {deepLink ? (
                <>
                  ссылку{" "}
                  <a
                    href={deepLink}
                    className="break-all text-accent select-all"
                  >
                    {deepLink}
                  </a>{" "}
                  или
                </>
              ) : (
                "откройте нашего бота и"
              )}{" "}
              напишите боту{" "}
              <span className="select-all">/start {owner.link_code}</span>.
              После привязки код перестанет работать.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <form action={createLinkCode.bind(null, owner.id)}>
            <button type="submit" className={primaryButtonClass}>
              {owner.link_code ? "Создать новый код" : "Создать код привязки"}
            </button>
          </form>
          {owner.telegram_chat_id && (
            <form action={unlinkTelegram.bind(null, owner.id)}>
              <button type="submit" className={secondaryButtonClass}>
                Отвязать бота
              </button>
            </form>
          )}
        </div>
      </section>

      <section className={`${cardClass} flex flex-col gap-3`}>
        <h2 className="font-serif text-xl font-medium">Ежемесячный отчёт</h2>
        <p className="text-sm text-text-secondary">
          Бот сам присылает его 1-го числа за прошлый месяц. Цифры те же, что в{" "}
          <Link
            href={`/admin/stats?month=${reportMonth}`}
            className="text-accent"
          >
            статистике за этот месяц
          </Link>
          .
        </p>
        {reportResult && (
          <p
            role="status"
            className={`rounded-[14px] p-3 ${
              reportResult === "sent"
                ? "bg-status-free-bg text-status-free-text"
                : "bg-status-limited-bg text-status-limited-text"
            }`}
          >
            {REPORT_RESULTS[reportResult]}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              name="month"
              defaultValue={reportMonth}
              className={`${inputClass} w-44`}
            />
            <button type="submit" className={secondaryButtonClass}>
              Показать
            </button>
          </form>
          <form action={sendReportNow.bind(null, owner.id)}>
            <input type="hidden" name="month" value={reportMonth} />
            <button
              type="submit"
              disabled={!owner.telegram_chat_id || !report}
              className={primaryButtonClass}
            >
              Отправить владельцу
            </button>
          </form>
        </div>
        {report ? (
          <pre className="rounded-[14px] bg-surface-muted p-3 font-sans text-sm whitespace-pre-wrap">
            {report.text}
          </pre>
        ) : (
          <p className="text-sm text-text-muted">
            У владельца нет объектов — отчёт не отправляется.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">Объекты</h2>
        {owner.places.length === 0 ? (
          <p className="text-sm text-text-muted">
            Нет объектов. Назначьте владельца в карточке объекта (поле
            «Владелец»).
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {owner.places.map((place) => (
              <li key={place.id} className="text-sm">
                <Link
                  href={`/admin/places/${place.id}`}
                  className="hover:underline"
                >
                  {place.name_ru}
                </Link>
                <span className="text-text-muted">
                  {" "}
                  · {PLACE_STATUSES[place.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl font-medium">Данные</h2>
        <OwnerForm owner={owner} />
      </section>
    </div>
  );
}
