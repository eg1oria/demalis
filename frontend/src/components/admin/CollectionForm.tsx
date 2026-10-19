"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  type SaveCollectionState,
  saveCollection,
} from "@/app/admin/(panel)/collections/actions";
import type { Collection } from "@/lib/collections";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  textareaClass,
} from "./ui";

export function CollectionForm({
  collection,
}: {
  collection: Collection | null;
}) {
  const [state, formAction] = useActionState<SaveCollectionState, FormData>(
    saveCollection,
    {},
  );
  const [pending, startTransition] = useTransition();

  // Отправляем вручную, чтобы React не сбрасывал поля формы при ошибке.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} className={`${cardClass} flex flex-col gap-3`}>
      {collection && <input type="hidden" name="id" value={collection.id} />}
      <label className={labelClass}>
        Заголовок (рус.)
        <input
          name="title_ru"
          required
          defaultValue={collection?.title_ru ?? ""}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Заголовок (каз.)
        <input
          name="title_kk"
          defaultValue={collection?.title_kk ?? ""}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Вводный текст (рус.)
        <textarea
          name="intro_ru"
          defaultValue={collection?.intro_ru ?? ""}
          className={textareaClass}
        />
      </label>
      <label className={labelClass}>
        Вводный текст (каз.)
        <textarea
          name="intro_kk"
          defaultValue={collection?.intro_kk ?? ""}
          className={textareaClass}
        />
      </label>
      <label className={labelClass}>
        Фильтры
        <input
          name="filters"
          defaultValue={collection?.filters ?? ""}
          placeholder="chan=1&drive=60"
          className={inputClass}
        />
        <span className="text-xs text-text-muted">
          Настройте фильтры в каталоге сайта и вставьте сюда адрес страницы
          целиком или часть после «?». Даты не сохраняются — их выбирает гость.
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Адрес (slug)
          <input
            name="slug"
            defaultValue={collection?.slug ?? ""}
            placeholder="из заголовка"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Порядок (меньше — выше, на главной первые 4)
          <input
            name="sort_order"
            type="number"
            defaultValue={collection?.sort_order ?? 100}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={collection?.published ?? true}
          className="size-5 accent-accent"
        />
        Опубликована
      </label>
      {state.error && (
        <p
          role="alert"
          className="rounded-[14px] bg-status-limited-bg p-3 text-status-limited-text"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} self-start`}
      >
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
