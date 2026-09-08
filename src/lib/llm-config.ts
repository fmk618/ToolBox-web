"use client";

import { createLocalStore } from "./create-local-store";

export type LLMConfig = {
  provider: string;
  model: string;
  api_key: string;
};

const store = createLocalStore<LLMConfig>("toolbox.llm");

export function saveLLMConfig(config: LLMConfig): void {
  store.write(config);
}

export function loadLLMConfig(): LLMConfig | null {
  return store.read();
}

export function clearLLMConfig(): void {
  store.remove();
}
