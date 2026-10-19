"use client";

import type { ComponentProps } from "react";
import { type AnalyticsEvent, trackEvent } from "@/lib/analytics";

/** Обычная ссылка, которая при нажатии отправляет событие в Google (конверсии). */
export function TrackedLink({
  event,
  params,
  onClick,
  ...props
}: ComponentProps<"a"> & {
  event: AnalyticsEvent;
  params?: Record<string, string>;
}) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent(event, params);
        onClick?.(e);
      }}
    />
  );
}
