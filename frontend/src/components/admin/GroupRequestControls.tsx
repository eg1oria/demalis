"use client";

import { useState, useTransition } from "react";
import {
  setGroupNote,
  setGroupStatus,
} from "@/app/admin/(panel)/groups/actions";
import { GROUP_STATUSES, type GroupStatus } from "@/lib/groups/validate";
import { inputClass, secondaryButtonClass, textareaClass } from "./ui";

/** Статус заявки на подбор (сохраняется сразу) и заметка админа. */
export function GroupRequestControls({
  id,
  status: initialStatus,
  note: initialNote,
}: {
  id: string;
  status: GroupStatus;
  note: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [savedNote, setSavedNote] = useState(initialNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onStatus = (next: GroupStatus) => {
    const previous = status;
    setStatus(next);
    setMessage(null);
    startTransition(async () => {
      const { error } = await setGroupStatus(id, next);
      if (error) {
        setStatus(previous);
        setMessage(`Ошибка: ${error}`);
      } else setMessage("Сохранено");
    });
  };

  const onNote = () => {
    setMessage(null);
    startTransition(async () => {
      const { error } = await setGroupNote(id, note);
      if (error) setMessage(`Ошибка: ${error}`);
      else {
        setSavedNote(note);
        setMessage("Заметка сохранена");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:w-64">
      <select
        aria-label="Статус подбора"
        value={status}
        disabled={pending}
        onChange={(e) => onStatus(e.target.value as GroupStatus)}
        className={inputClass}
      >
        {Object.entries(GROUP_STATUSES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        aria-label="Заметка"
        value={note}
        maxLength={2000}
        placeholder="Заметка: какие варианты отправили…"
        onChange={(e) => setNote(e.target.value)}
        className={`${textareaClass} min-h-20 text-sm`}
      />
      {note !== savedNote && (
        <button
          type="button"
          disabled={pending}
          onClick={onNote}
          className={secondaryButtonClass}
        >
          Сохранить заметку
        </button>
      )}
      {message && (
        <span role="status" className="text-xs text-text-muted">
          {message}
        </span>
      )}
    </div>
  );
}
