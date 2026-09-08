"use client";

import { createLocalStore } from "./create-local-store";

const store = createLocalStore<string[]>("toolbox.favorites");

export function toggleFavorite(slug: string): void {
  const list = store.read() ?? [];
  store.write(
    list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list],
  );
}

export function isFavorite(slug: string): boolean {
  return (store.read() ?? []).includes(slug);
}

export function useFavorites(): string[] {
  return store.useValue() ?? [];
}
