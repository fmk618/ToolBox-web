export const API_BASE =
  (typeof window !== "undefined" && localStorage.getItem("toolbox.apiBase")) ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "/api";

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
  adminToken?: string,
): Promise<LLMSettingsView> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}/settings/llm`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function clearLLMSettings(adminToken?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}/settings/llm`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function testLLMSettings(
  body: LLMSettingsBody,
  adminToken?: string,
): Promise<{ ok: boolean; message: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}/settings/llm/test`, {
    method: "POST",
    headers,
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
 * POST /jobs — upload file and start async conversion job.
 * Returns job_id immediately; use pollJob() and downloadJobResult() for progress.
 */
export function submitJob(
  file: File,
  to: string,
  onUploadProgress?: (percent: number) => void,
): Promise<{ job_id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${FILE_CONVERT}/jobs?to=${encodeURIComponent(to)}`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as { job_id: string });
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("网络错误，请检查后端服务"));
    xhr.onabort = () => reject(new Error("已取消"));

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export type JobStatusResponse = {
  status: "processing" | "done" | "failed";
  progress: number;
  error?: string | null;
  filename?: string | null;
};

/** GET /jobs/{job_id} — poll conversion progress. */
export async function pollJob(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${FILE_CONVERT}/jobs/${jobId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** GET /jobs/{job_id}/result — download converted file. */
export async function downloadJobResult(
  jobId: string,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${FILE_CONVERT}/jobs/${jobId}/result`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cd = res.headers.get("content-disposition") ?? "";
  const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match?.[1]?.replace(/['"]/g, "") || fallbackFilename;
  return { blob: await res.blob(), filename };
}

/**
 * POST /convert with XHR (so we can track upload progress, which fetch() can't).
 * @deprecated Use submitJob + pollJob + downloadJobResult for real progress tracking.
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
