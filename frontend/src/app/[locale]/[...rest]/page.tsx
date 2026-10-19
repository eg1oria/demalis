import { notFound } from "next/navigation";

// Любой неизвестный адрес внутри /ru или /kk → локализованная 404.
export default function CatchAll() {
  notFound();
}
