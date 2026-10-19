import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/request";

/** Cookie с токеном сессии админки (выдаёт бэкенд, хранит Next). */
export const ADMIN_COOKIE = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    path: string,
  ) {
    super(
      `API ${status} ${path}: ${
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : JSON.stringify(body)
      }`,
    );
  }
}

/** Адрес бэкенда для запросов с сервера Next.js. */
export function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("Не задан API_URL — см. .env.example");
  return url.replace(/\/$/, "");
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  /** Токен админа из cookie; 401 — на страницу входа. */
  admin?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const requestHeaders = new Headers(options.headers);
  if (options.body !== undefined)
    requestHeaders.set("content-type", "application/json");
  if (options.admin) {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (token) requestHeaders.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: requestHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    // Админка всегда свежая; публичные страницы кэширует сам Next (revalidate).
    ...(options.admin ? { cache: "no-store" as const } : {}),
  });
  if (options.admin && response.status === 401) redirect("/admin/login");
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data, path);
  return data as T;
}

/** То же, но 404 → null (объект не найден или не опубликован). */
export async function apiOrNull<T>(
  path: string,
  options?: Options,
): Promise<T | null> {
  try {
    return await api<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const adminApi = <T>(
  path: string,
  options: Omit<Options, "admin"> = {},
) => api<T>(path, { ...options, admin: true });

/**
 * Заголовки для форм с сайта: бэкенд видит запрос от сервера Next.js,
 * поэтому настоящий IP посетителя передаём вместе с общим секретом.
 */
export async function visitorHeaders(): Promise<HeadersInit> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return {};
  return {
    "x-internal-secret": secret,
    "x-client-ip": clientIp(await headers()),
  };
}

/** Строка запроса без пустых значений. */
export function query(
  params: Record<string, string | number | undefined | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}
