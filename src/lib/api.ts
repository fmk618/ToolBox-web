"use client";

/** localStorage 键：用户在系统设置里自定义的后端地址。 */
export const API_BASE_KEY = "toolbox.apiBase";

/**
 * 后端地址按调用时解析（而不是模块加载时常量）：
 * 用户设置 > 构建期注入 > 同源 /api。改完设置立即生效，无需整页刷新。
 */
export function getApiBase(): string {
  return (
    (typeof window !== "undefined" && localStorage.getItem(API_BASE_KEY)) ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "/api"
  );
}

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

export type LLMTestBody = {
  provider: string;
  model: string;
  api_key: string;
};

export async function fetchProviders(): Promise<ProviderSpec[]> {
  const res = await fetch(`${getApiBase()}/providers`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function testLLMSettings(
  body: LLMTestBody,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${getApiBase()}/settings/llm/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchRoutes(): Promise<Routes> {
  const res = await fetch(`${getApiBase()}/tools/file-convert/routes`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchEngines(): Promise<EngineInfo[]> {
  const res = await fetch(`${getApiBase()}/tools/file-convert/engines`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** 从后端错误响应里尽量提取可读信息（FastAPI 约定 {"detail": ...}）。 */
async function readErrorMessage(status: number, res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const detail = (JSON.parse(text) as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    /* 非 JSON 响应体，直接用原文 */
  }
  return text || `HTTP ${status}`;
}

/**
 * POST FormData 到工具端点，返回二进制结果。
 * 统一错误处理：非 2xx 抛出后端 detail（而不是干巴巴的 HTTP 状态码）。
 */
export async function postFormForBlob(
  path: string,
  form: FormData,
): Promise<Blob> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await readErrorMessage(res.status, res));
  return res.blob();
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
export type LLMConfig = {
  provider: string;
  model: string;
  api_key: string;
};

export function submitJob(
  file: File,
  to: string,
  onUploadProgress?: (percent: number) => void,
  llmConfig?: LLMConfig,
): Promise<{ job_id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${getApiBase()}/tools/file-convert/jobs?to=${encodeURIComponent(to)}`,
    );
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
    if (llmConfig) {
      fd.append("llm_provider", llmConfig.provider);
      fd.append("llm_model", llmConfig.model);
      fd.append("llm_api_key", llmConfig.api_key);
    }
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
  const res = await fetch(
    `${getApiBase()}/tools/file-convert/jobs/${encodeURIComponent(jobId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** GET /jobs/{job_id}/result — download converted file. */
export async function downloadJobResult(
  jobId: string,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(
    `${getApiBase()}/tools/file-convert/jobs/${encodeURIComponent(jobId)}/result`,
  );
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
      `${getApiBase()}/tools/file-convert/convert?to=${encodeURIComponent(to)}`,
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
