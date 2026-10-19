"use client";

import { useEffect } from "react";

// Защита от двойного вызова эффекта в режиме разработки.
const sent = new Set<string>();

/** Записывает просмотр страницы объекта (не чаще раза в 30 минут — решает сервер по cookie). */
export function ViewTracker({ placeId }: { placeId: string }) {
  useEffect(() => {
    if (sent.has(placeId)) return;
    sent.add(placeId);
    fetch(`/api/view/${placeId}`, { method: "POST", keepalive: true }).catch(
      () => {},
    );
  }, [placeId]);
  return null;
}
