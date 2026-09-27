"use client";

import Image from "next/image";
import { useState } from "react";
import { createPhotoUpload } from "@/app/admin/(panel)/places/actions";
import { PHOTOS_BUCKET } from "@/lib/places/constants";
import { createClient } from "@/lib/supabase/browser";
import { photoUrl } from "@/lib/supabase/env";
import { secondaryButtonClass } from "./ui";

/**
 * Загрузка фото прямо в Supabase Storage по подписанной ссылке.
 * Список путей уходит в форму скрытым полем `photos` и сохраняется вместе с объектом.
 */
export function PhotoManager({ initial }: { initial: string[] }) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList) => {
    setError(null);
    const supabase = createClient();
    const list = Array.from(files);
    setUploading((n) => n + list.length);

    await Promise.all(
      list.map(async (file) => {
        try {
          const signed = await createPhotoUpload(file.type);
          if ("error" in signed) throw new Error(signed.error);
          const { error: uploadError } = await supabase.storage
            .from(PHOTOS_BUCKET)
            .uploadToSignedUrl(signed.path, signed.token, file, {
              contentType: file.type,
            });
          if (uploadError) throw uploadError;
          setPhotos((prev) => [...prev, signed.path]);
        } catch (e) {
          setError(
            `«${file.name}»: ${e instanceof Error ? e.message : "ошибка загрузки"}`,
          );
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  };

  const remove = (path: string) =>
    setPhotos((prev) => prev.filter((p) => p !== path));
  const makeFirst = (path: string) =>
    setPhotos((prev) => [path, ...prev.filter((p) => p !== path)]);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((path, i) => (
            <li key={path} className="flex flex-col gap-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-surface-muted">
                <Image
                  src={photoUrl(path)}
                  alt=""
                  fill
                  unoptimized
                  sizes="200px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-surface px-2 py-0.5 text-xs">
                    Главное
                  </span>
                )}
              </div>
              <div className="flex text-sm">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => makeFirst(path)}
                    className="h-11 flex-1 text-accent"
                  >
                    Сделать главным
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(path)}
                  className="h-11 flex-1 text-text-muted"
                >
                  Убрать
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className={`${secondaryButtonClass} cursor-pointer self-start`}>
        {uploading > 0 ? `Загружаем… (${uploading})` : "Добавить фото"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={uploading > 0}
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-xs text-text-faint">
        JPG, PNG или WebP до 10 МБ. Изменения фото сохраняются кнопкой
        «Сохранить».
      </p>
      {error && <p className="text-sm text-status-limited-text">{error}</p>}
    </div>
  );
}
