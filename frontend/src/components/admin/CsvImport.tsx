"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState, useTransition } from "react";
import {
  type ImportRowResult,
  importPlaces,
} from "@/app/admin/(panel)/places/actions";
import {
  FIELD_LABELS,
  type RawPlaceInput,
  validatePlaceInput,
} from "@/lib/places/validate";
import { primaryButtonClass, secondaryButtonClass } from "./ui";

type PreviewRow = { line: number; raw: RawPlaceInput; errors: string[] };

const KNOWN_COLUMNS = new Set(Object.keys(FIELD_LABELS));

export function CsvImport() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [pending, startTransition] = useTransition();

  const validRows = rows.filter((r) => r.errors.length === 0);

  const onFile = (file: File) => {
    setFileName(file.name);
    setResults(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().replace(/^﻿/, ""),
      complete: ({ data, meta, errors }) => {
        const unknown = (meta.fields ?? []).filter(
          (f) => !KNOWN_COLUMNS.has(f),
        );
        setWarnings([
          ...unknown.map(
            (f) => `Колонка «${f}» не распознана и будет пропущена`,
          ),
          ...errors.map((e) => `Строка ${(e.row ?? 0) + 2}: ${e.message}`),
        ]);
        setRows(
          data.map((raw, i) => {
            const result = validatePlaceInput(raw);
            return {
              line: i + 2, // строка 1 — заголовки
              raw,
              errors: result.ok ? [] : result.errors.map((e) => e.message),
            };
          }),
        );
      },
    });
  };

  const runImport = () =>
    startTransition(async () => {
      setResults(
        await importPlaces(validRows.map(({ line, raw }) => ({ line, raw }))),
      );
    });

  if (results) {
    const ok = results.filter((r) => r.ok);
    const failed = [
      ...results.filter((r) => !r.ok),
      ...rows.filter((r) => r.errors.length),
    ];
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-[14px] bg-status-free-bg p-3 text-status-free-text">
          Импортировано: {ok.length}. С ошибками пропущено: {failed.length}.
        </p>
        <ul className="flex flex-col gap-1">
          {ok.map((r) => (
            <li key={r.line}>
              ✅ Строка {r.line}:{" "}
              <Link
                href={`/admin/places/${r.id}`}
                className="text-accent underline"
              >
                {r.name}
              </Link>
            </li>
          ))}
          {failed.map((r) => (
            <li key={r.line} className="text-status-limited-text">
              ❌ Строка {r.line}: {r.errors.join("; ")}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            setRows([]);
            setResults(null);
            setFileName(null);
          }}
          className={`${secondaryButtonClass} self-start`}
        >
          Загрузить другой файл
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className={`${secondaryButtonClass} cursor-pointer self-start`}>
        {fileName ? `Файл: ${fileName}` : "Выбрать CSV-файл"}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {warnings.map((w) => (
        <p key={w} className="text-sm text-status-limited-text">
          ⚠️ {w}
        </p>
      ))}

      {rows.length > 0 && (
        <>
          <p className="text-text-secondary">
            Строк в файле: {rows.length}. Готовы к импорту: {validRows.length}.
            С ошибками: {rows.length - validRows.length}.
          </p>
          <div className="overflow-x-auto rounded-[14px] border border-line-soft bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="text-text-muted">
                <tr>
                  <th className="p-2">Строка</th>
                  <th className="p-2">Название</th>
                  <th className="p-2">Тип / направление</th>
                  <th className="p-2">Телефон</th>
                  <th className="p-2">Проверка</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.line}
                    className="border-t border-line-soft align-top"
                  >
                    <td className="p-2">{r.line}</td>
                    <td className="p-2">{r.raw.name_ru}</td>
                    <td className="p-2">
                      {r.raw.type} / {r.raw.direction}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {r.raw.whatsapp_phone}
                    </td>
                    <td className="p-2">
                      {r.errors.length === 0 ? (
                        <span className="text-status-free-text">✅ OK</span>
                      ) : (
                        <ul className="text-status-limited-text">
                          {r.errors.map((e) => (
                            <li key={e}>❌ {e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={runImport}
            disabled={pending || validRows.length === 0}
            className={`${primaryButtonClass} self-start`}
          >
            {pending
              ? "Импортируем…"
              : `Импортировать ${validRows.length} ${pluralRows(validRows.length)}`}
          </button>
          {rows.length > validRows.length && (
            <p className="text-sm text-text-muted">
              Строки с ошибками будут пропущены — исправьте их в файле и
              загрузите отдельно.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function pluralRows(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "строку";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "строки";
  return "строк";
}
