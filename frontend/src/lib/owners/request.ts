import { normalizeKzPhone } from "@/lib/phone";
import {
  DIRECTIONS,
  type Direction,
  PLACE_TYPES,
  type PlaceType,
} from "@/lib/places/constants";

/** Заявка владельца «Добавить объект» (Этап 7). */
export type OwnerRequestField =
  "name" | "phone" | "instagram" | "direction" | "type" | "consent";

export type OwnerRequestError = "required" | "tooLong" | "invalid";

export type OwnerRequest = {
  name: string;
  phone: string;
  instagram_url: string | null;
  direction: Direction;
  type: PlaceType;
};

export const OWNER_REQUEST_NAME_MAX = 100;

const NICK = /^[a-z0-9._]{1,30}$/i;

/**
 * Instagram: «@nick», «nick», «instagram.com/nick», полная ссылка → https://www.instagram.com/nick/.
 * Пусто → null, мусор → undefined.
 */
export function normalizeInstagram(input: string): string | null | undefined {
  const value = input.trim();
  if (!value) return null;
  const link = value.match(
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#\s]+)\/?(?:[?#].*)?$/i,
  );
  const nick = link ? link[1] : value.replace(/^@/, "");
  return NICK.test(nick) ? `https://www.instagram.com/${nick}/` : undefined;
}

export function validateOwnerRequest(
  raw: Partial<Record<OwnerRequestField, string>>,
):
  | { ok: true; data: OwnerRequest }
  | {
      ok: false;
      errors: Partial<Record<OwnerRequestField, OwnerRequestError>>;
    } {
  const errors: Partial<Record<OwnerRequestField, OwnerRequestError>> = {};

  const name = raw.name?.trim().replace(/\s+/g, " ") ?? "";
  if (!name) errors.name = "required";
  else if (name.length > OWNER_REQUEST_NAME_MAX) errors.name = "tooLong";

  const rawPhone = raw.phone?.trim() ?? "";
  const phone = normalizeKzPhone(rawPhone);
  if (!rawPhone) errors.phone = "required";
  else if (!phone) errors.phone = "invalid";

  const instagram = normalizeInstagram(raw.instagram ?? "");
  if (instagram === undefined) errors.instagram = "invalid";

  const direction = raw.direction ?? "";
  if (!(direction in DIRECTIONS)) errors.direction = "required";

  const type = raw.type ?? "";
  if (!(type in PLACE_TYPES)) errors.type = "required";

  // Без согласия не принимаем: публиковать фото без разрешения нельзя (ТЗ, раздел 5).
  if (raw.consent !== "on") errors.consent = "required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      phone: phone!,
      instagram_url: instagram ?? null,
      direction: direction as Direction,
      type: type as PlaceType,
    },
  };
}
