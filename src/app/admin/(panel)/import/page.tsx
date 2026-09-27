import type { Metadata } from "next";
import { CsvImport } from "@/components/admin/CsvImport";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Импорт CSV" };

export default async function ImportPage() {
  await requireAdminPage();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">
        Импорт объектов из CSV
      </h1>
      <ol className="list-decimal space-y-1 pl-5 text-text-secondary">
        <li>
          Скачайте{" "}
          <a
            href="/places_template.csv"
            download
            className="text-accent underline"
          >
            шаблон places_template.csv
          </a>{" "}
          и заполните его в Google Таблицах или Excel. Первая строка — названия
          колонок, не меняйте их.
        </li>
        <li>
          Обязательные колонки: <b>name_ru</b>, <b>type</b>, <b>direction</b>,{" "}
          <b>whatsapp_phone</b>. Удобства — «да»/«нет» или 1/0. Тип и
          направление — код (<code>glamping</code>) или название («Глэмпинг»).
        </li>
        <li>
          Сохраните как CSV в кодировке UTF-8 (в Excel: «CSV UTF-8»).
          Разделитель — запятая или точка с запятой.
        </li>
        <li>
          Все объекты создаются черновиками — опубликуете их после проверки.
        </li>
      </ol>
      <CsvImport />
    </div>
  );
}
