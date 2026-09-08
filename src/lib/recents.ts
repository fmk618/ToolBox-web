"use client";

import { createLocalStore } from "./create-local-store";

const store = createLocalStore<string[]>("toolbox.recents", { max: 8 });

export function pushRecent(slug: string): void {
  store.write([slug, ...(store.read() ?? []).filter((s) => s !== slug)]);
}

export function removeRecent(slug: string): void {
  store.write((store.read() ?? []).filter((s) => s !== slug));
}

export function useRecents(): string[] {
  return store.useValue() ?? [];
}
