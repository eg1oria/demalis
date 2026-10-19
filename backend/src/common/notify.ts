import { Logger } from '@nestjs/common';

const logger = new Logger('Notify');

/** Уведомление после ответа посетителю: ошибка — только в лог. */
export function runInBackground(name: string, job: () => Promise<unknown>) {
  setImmediate(() => {
    job().catch((e) =>
      logger.error(`${name}: ${e instanceof Error ? e.stack : e}`),
    );
  });
}
