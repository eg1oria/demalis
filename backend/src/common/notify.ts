import { reportError } from './alerts';

/** Уведомление после ответа посетителю: ошибка — в лог и админу в Telegram. */
export function runInBackground(name: string, job: () => Promise<unknown>) {
  setImmediate(() => {
    job().catch((e) => reportError(name, e));
  });
}
