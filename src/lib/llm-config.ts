const KEY = "toolbox.llm";

export type LLMConfig = {
  provider: string;
  model: string;
  api_key: string;
};

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function loadLLMConfig(): LLMConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LLMConfig) : null;
  } catch {
    return null;
  }
}

export function clearLLMConfig(): void {
  localStorage.removeItem(KEY);
}
