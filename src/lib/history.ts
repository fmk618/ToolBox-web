"use client";

import { createLocalStore } from "./create-local-store";

export type HistoryEntry = {
  srcName: string;
  srcFmt: string;
  dstFmt: string;
  size: number;
  at: number;
};

const store = createLocalStore<HistoryEntry[]>("toolbox.history", { max: 50 });

export function addHistory(entry: HistoryEntry) {
  store.write([entry, ...(store.read() ?? [])]);
}

export function clearHistory() {
  store.write([]);
}

export function useHistory(): HistoryEntry[] {
  return store.useValue() ?? [];
}
