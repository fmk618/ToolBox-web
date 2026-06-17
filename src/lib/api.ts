export const API_BASE =
  (typeof window !== "undefined" && localStorage.getItem("toolbox.apiBase")) ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000";

export type Routes = Record<string, { to: string; engine: string }[]>;

export type EngineInfo = {
  name: string;
  available: boolean;
  edges: [string, string][];
  active_provider?: { id: string; label: string; model: string } | null;
};

export type ProviderSpec = {
  id: string;
  label: string;
  base_url: string;
  models: string[];
  default_model: string;
  api_docs: string;
  description: string;
};

export type LLMSettingsView = {
  provider: string | null;
  model: string | null;
  has_key: boolean;
  key_preview: string;
};

export type LLMSettingsBody = {
  provider: string;
  model: string;
  api_key: string;
};

export async function fetchProviders(): Promise<ProviderSpec[]> {
  const res = await fetch(`${API_BASE}/providers`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchLLMSettings(): Promise<LLMSettingsView> {
  const res = await fetch(`${API_BASE}/settings/llm`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveLLMSettings(
  body: LLMSettingsBody,
): Promise<LLMSettingsView> {
  const res = await fetch(`${API_BASE}/settings/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function clearLLMSettings(): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/llm`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function testLLMSettings(
  body: LLMSettingsBody,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/settings/llm/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const FILE_CONVERT = `${API_BASE}/tools/file-convert`;

export async function fetchRoutes(): Promise<Routes> {
  const res = await fetch(`${FILE_CONVERT}/routes`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchEngines(): Promise<EngineInfo[]> {
  const res = await fetch(`${FILE_CONVERT}/engines`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export function reachableFormats(routes: Routes, src: string | null): string[] {
  if (!src) return [];
  const visited = new Set<string>([src]);
  const queue: string[] = [src];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const { to } of routes[cur] ?? []) {
      if (!visited.has(to)) {
        visited.add(to);
        queue.push(to);
      }
    }
  }
  visited.delete(src);
  return Array.from(visited).sort();
}

/**
 * POST /convert with XHR (so we can track upload progress, which fetch() can't).
 */
export function convertFile(
  file: File,
  to: string,
  onUploadProgress?: (percent: number) => void,
): Promise<{ blob: Blob; filename: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${FILE_CONVERT}/convert?to=${encodeURIComponent(to)}`,
    );
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const base = file.name.replace(/\.[^.]+$/, "");
        const filename = `${base}.${to}`;
        resolve({ blob: xhr.response, filename });
      } else {
        const reader = new FileReader();
        reader.onload = () =>
          reject(
            new Error(
              (reader.result as string) || `HTTP ${xhr.status}: ${xhr.statusText}`,
            ),
          );
        reader.readAsText(xhr.response);
      }
    };

    xhr.onerror = () => reject(new Error("网络错误，请检查后端服务"));
    xhr.onabort = () => reject(new Error("已取消"));

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}
