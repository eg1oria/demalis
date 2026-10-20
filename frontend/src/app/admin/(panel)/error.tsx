"use client";

/** Ошибка на странице админки. Сама ошибка уже ушла в Telegram (src/instrumentation.ts). */
export default function AdminError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-xl font-medium">Что-то пошло не так</h1>
      <p className="mt-2 text-text-secondary">
        Ошибка уже отправлена в Telegram. Если бэкенд недоступен, проверьте
        сервер (docs/SETUP.md, «Мониторинг»).
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 h-11 rounded-[10px] bg-text px-4 text-sm font-medium text-white"
      >
        Попробовать ещё раз
      </button>
    </main>
  );
}
