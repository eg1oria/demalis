"use client";

import { type FormEvent, useState, useTransition } from "react";
import {
  deleteUnit,
  saveUnit,
  type UnitFormState,
} from "@/app/admin/(panel)/places/actions";
import type { Tables } from "@/lib/api/types";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

type Unit = Tables<"units">;

/**
 * Домики объекта: своя вместимость, цены и занятость. С домиками владелец
 * отмечает даты по каждому, а статус объекта сайт считает сам.
 */
export function UnitsSection({
  placeId,
  units,
}: {
  placeId: string;
  units: Unit[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div>
        <h2 className="font-display text-lg font-medium tracking-[-0.03em]">
          Домики и номера
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Если в объекте несколько домиков разного размера — добавьте их. Тогда
          занятость отмечается по каждому домику (в боте и в сетке занятости),
          «Гостей максимум» = сумма мест, а гость видит, какой домик свободен и
          сколько он стоит. Первый домик получит текущие отметки объекта.
        </p>
      </div>
      {units.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {units.map((unit) => (
            <li key={unit.id} className="py-3 first:pt-0">
              <UnitForm placeId={placeId} unit={unit} />
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <UnitForm
          placeId={placeId}
          unit={null}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`${secondaryButtonClass} self-start`}
        >
          + Добавить домик
        </button>
      )}
    </section>
  );
}

function UnitForm({
  placeId,
  unit,
  onDone,
}: {
  placeId: string;
  unit: Unit | null;
  onDone?: () => void;
}) {
  const [state, setState] = useState<UnitFormState>({});
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveUnit(placeId, unit?.id ?? null, formData);
      setState(result);
      if (result.saved) onDone?.();
    });
  };
  const onDelete = () => {
    if (!unit || !confirm(`Удалить «${unit.name_ru}» и его занятость?`)) return;
    startTransition(async () => {
      setState(await deleteUnit(placeId, unit.id));
    });
  };
  const num = (value: number | null | undefined) =>
    value == null ? "" : String(value);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-[2fr_2fr_1fr]">
        <label className={labelClass}>
          Название (рус.)
          <input
            name="name_ru"
            required
            defaultValue={unit?.name_ru ?? ""}
            placeholder="Домик у реки"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Название (каз.)
          <input
            name="name_kk"
            defaultValue={unit?.name_kk ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Мест
          <input
            name="capacity"
            required
            inputMode="numeric"
            defaultValue={num(unit?.capacity)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className={labelClass}>
          Будни, ₸
          <input
            name="price_weekday"
            inputMode="numeric"
            defaultValue={num(unit?.price_weekday)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Пт и сб, ₸
          <input
            name="price_weekend"
            inputMode="numeric"
            defaultValue={num(unit?.price_weekend)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Праздники, ₸
          <input
            name="price_holiday"
            inputMode="numeric"
            defaultValue={num(unit?.price_holiday)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Порядок
          <input
            name="sort_order"
            inputMode="numeric"
            defaultValue={num(unit?.sort_order ?? 100)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Сохраняем…" : unit ? "Сохранить" : "Добавить"}
        </button>
        {unit ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className={secondaryButtonClass}
          >
            Удалить
          </button>
        ) : (
          <button
            type="button"
            onClick={onDone}
            className={secondaryButtonClass}
          >
            Отмена
          </button>
        )}
        {state.error && (
          <span role="alert" className="text-sm text-status-limited-text">
            {state.error}
          </span>
        )}
        {state.saved && unit && (
          <span role="status" className="text-sm text-text-muted">
            Сохранено
          </span>
        )}
      </div>
    </form>
  );
}
