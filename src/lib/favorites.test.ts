import { describe, expect, it } from "vitest";
import {
  FAVORITES_MAX,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from "./favorites";

const A = "9c3fc9d6-b03e-4521-a403-5a67db7e65ec";
const B = "1b2c3d4e-0000-4000-8000-000000000001";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

describe("parseFavorites", () => {
  it("пустое значение — пустой список", () => {
    expect(parseFavorites(undefined)).toEqual([]);
    expect(parseFavorites("")).toEqual([]);
  });

  it("читает id через точку и убирает повторы", () => {
    expect(parseFavorites(`${A}.${B}.${A}`)).toEqual([A, B]);
  });

  it("отбрасывает мусор и чужие значения", () => {
    expect(parseFavorites(`${A}.abc.<script>.${B}`)).toEqual([A, B]);
    expect(parseFavorites("%E0%A4%A")).toEqual([]);
  });

  it("приводит к нижнему регистру", () => {
    expect(parseFavorites(A.toUpperCase())).toEqual([A]);
  });

  it("не больше лимита", () => {
    const many = Array.from({ length: FAVORITES_MAX + 10 }, (_, i) => uuid(i));
    expect(parseFavorites(many.join("."))).toHaveLength(FAVORITES_MAX);
  });
});

describe("toggleFavorite", () => {
  it("добавляет в начало и убирает повторным нажатием", () => {
    const added = toggleFavorite([A], B);
    expect(added).toEqual([B, A]);
    expect(toggleFavorite(added, B)).toEqual([A]);
  });

  it("при переполнении выпадают самые старые", () => {
    const full = Array.from({ length: FAVORITES_MAX }, (_, i) => uuid(i));
    const next = toggleFavorite(full, A);
    expect(next).toHaveLength(FAVORITES_MAX);
    expect(next[0]).toBe(A);
    expect(next).not.toContain(full[FAVORITES_MAX - 1]);
  });
});

describe("serializeFavorites", () => {
  it("туда и обратно", () => {
    expect(parseFavorites(serializeFavorites([A, B]))).toEqual([A, B]);
  });
});
