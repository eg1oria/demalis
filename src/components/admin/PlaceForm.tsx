"use client";

import { type FormEvent, useActionState, useState, useTransition } from "react";
import {
  type SavePlaceState,
  savePlace,
} from "@/app/admin/(panel)/places/actions";
import {
  AMENITIES,
  DIRECTIONS,
  PLACE_STATUSES,
  PLACE_TYPES,
  PLANS,
  PRICE_UNITS,
} from "@/lib/places/constants";
import { PLAN_FEATURES } from "@/config/pricing";
import { slugify } from "@/lib/slug";
import type { Tables } from "@/lib/supabase/database.types";
import { PhotoManager } from "./PhotoManager";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  textareaClass,
} from "./ui";

type Place = Tables<"places">;
type Owner = Pick<Tables<"owners">, "id" | "name">;

export function PlaceForm({
  place,
  owners,
}: {
  place: Place | null;
  owners: Owner[];
}) {
  const [state, formAction] = useActionState<SavePlaceState, FormData>(
    savePlace,
    {},
  );
  const [pending, startTransition] = useTransition();
  const [nameRu, setNameRu] = useState(place?.name_ru ?? "");
  const [photosPermission, setPhotosPermission] = useState(
    place?.photos_permission ?? false,
  );

  const errors = state.errors ?? [];
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  // Отправляем вручную, чтобы React не сбрасывал поля формы при ошибке.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  const text = (
    name: keyof Place,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        defaultValue={(place?.[name] as string | number | null) ?? ""}
        aria-invalid={Boolean(errorFor(name))}
        className={inputClass}
        {...props}
      />
      <FieldError message={errorFor(name)} />
    </label>
  );

  const select = (
    name: keyof Place,
    label: string,
    options: Record<string, string>,
    fallback?: string,
  ) => (
    <label className={labelClass}>
      {label}
      <select
        name={name}
        defaultValue={(place?.[name] as string | null) ?? fallback ?? ""}
        required={!fallback}
        className={inputClass}
      >
        {!fallback && <option value="">— выберите —</option>}
        {Object.entries(options).map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
      <FieldError message={errorFor(name)} />
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {place && <input type="hidden" name="id" value={place.id} />}

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-[14px] bg-status-limited-bg p-4 text-status-limited-text"
        >
          <p className="font-medium">Исправьте ошибки:</p>
          <ul className="list-disc pl-5">
            {errors.map((e) => (
              <li key={e.field + e.message}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <Section title="Основное">
        <label className={labelClass}>
          Название (рус) *
          <input
            name="name_ru"
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            required
            aria-invalid={Boolean(errorFor("name_ru"))}
            className={inputClass}
          />
          <FieldError message={errorFor("name_ru")} />
        </label>
        {text("name_kk", "Название (каз) — если пусто, покажем русское")}
        {text("slug", "Адрес страницы (slug)", {
          placeholder: slugify(nameRu) || "заполнится из названия",
        })}
        <p className="-mt-2 text-xs text-text-faint">
          Оставьте пустым — адрес создастся из названия автоматически.
        </p>
        {select("type", "Тип *", PLACE_TYPES)}
        {select("direction", "Направление *", DIRECTIONS)}
        {select("status", "Статус", PLACE_STATUSES, "draft")}
      </Section>

      <Section title="Расположение">
        {text("address_text", "Адрес")}
        <div className="grid grid-cols-2 gap-3">
          {text("lat", "Широта", {
            inputMode: "decimal",
            placeholder: "43.2389",
          })}
          {text("lng", "Долгота", {
            inputMode: "decimal",
            placeholder: "76.8897",
          })}
        </div>
        {text("drive_minutes", "Время в пути от центра Алматы, мин", {
          inputMode: "numeric",
        })}
      </Section>

      <Section title="Цена и вместимость">
        <div className="grid grid-cols-2 gap-3">
          {text("price_from", "Цена от, ₸", { inputMode: "numeric" })}
          {select("price_unit", "Цена за", PRICE_UNITS, "per_night_unit")}
        </div>
        {text("capacity_max", "Гостей максимум", { inputMode: "numeric" })}
      </Section>

      <Section title="Удобства">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(AMENITIES).map(([name, label]) => (
            <Checkbox
              key={name}
              name={name}
              label={label}
              defaultChecked={Boolean(place?.[name as keyof Place])}
            />
          ))}
        </div>
      </Section>

      <Section title="Описание">
        <label className={labelClass}>
          Описание (рус)
          <textarea
            name="description_ru"
            defaultValue={place?.description_ru ?? ""}
            className={textareaClass}
          />
        </label>
        <label className={labelClass}>
          Описание (каз) — если пусто, покажем русское
          <textarea
            name="description_kk"
            defaultValue={place?.description_kk ?? ""}
            className={textareaClass}
          />
        </label>
      </Section>

      <Section title="Контакты">
        {text("whatsapp_phone", "Телефон WhatsApp *", {
          type: "tel",
          placeholder: "+77011234567",
          required: true,
        })}
        {text("instagram_url", "Instagram (ссылка или @ник)")}
        {text("video_url", "Видео (Reels / TikTok / YouTube)", { type: "url" })}
      </Section>

      <Section title="Фото">
        <Checkbox
          name="photos_permission"
          label="Владелец разрешил использовать фото"
          checked={photosPermission}
          onChange={setPhotosPermission}
        />
        {!photosPermission && (
          <p className="text-sm text-status-limited-text">
            Без разрешения фото не будут показаны на сайте — вместо них будет
            заглушка.
          </p>
        )}
        <PhotoManager initial={place?.photos ?? []} />
        <FieldError message={errorFor("photos")} />
      </Section>

      <Section title="Тариф и владелец">
        <div className="grid gap-3 sm:grid-cols-3">
          {select("plan", "Тариф", PLANS, "free")}
          {text("pro_until", "Pro до (включительно)", { type: "date" })}
          {text("featured_until", "Продвижение до (включительно)", {
            type: "date",
          })}
        </div>
        <p className="text-xs text-text-muted">
          Free: {PLAN_FEATURES.free.photos} фото, без видео и календаря (гости
          видят «Уточняйте наличие»). Pro: до {PLAN_FEATURES.pro.photos} фото,
          видео, календарь, плашка «Проверено», статистика в боте. Пустая дата
          «Pro до» — без срока; после даты объект сам вернётся на Free.
        </p>
        <label className={labelClass}>
          Владелец
          <select
            name="owner_id"
            defaultValue={place?.owner_id ?? ""}
            className={inputClass}
          >
            <option value="">— не привязан —</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <FieldError message={errorFor("form")} />

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg/95 px-4 py-3">
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} w-full sm:w-auto`}
        >
          {pending ? "Сохраняем…" : place ? "Сохранить" : "Создать объект"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={`${cardClass} flex flex-col gap-3`}>
      <legend className="float-left mb-1 font-serif text-lg font-medium">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-text">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange && ((e) => onChange(e.target.checked))}
        className="size-5 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-sm text-status-limited-text">{message}</span>;
}
