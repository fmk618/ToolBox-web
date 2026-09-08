"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { submitJob, pollJob, downloadJobResult, type JobStatusResponse } from "./api";
import { loadLLMConfig } from "./llm-config";
import { addHistory } from "./history";
import { newId } from "./id";
import { downloadDataUrl } from "./download";

export type JobStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "done"
  | "failed"
  | "canceled";

export type Job = {
  id: string;
  file: File;
  filename: string;
  size: number;
  srcFmt: string;
  dstFmt: string;
  status: JobStatus;
  progress: number; // 0-100, upload phase only; -1 means indeterminate
  error?: string;
  resultBlobUrl?: string;
  resultName?: string;
  startedAt: number;
  finishedAt?: number;
};

type JobsCtx = {
  jobs: Job[];
  enqueue: (input: {
    file: File;
    srcFmt: string;
    dstFmt: string;
  }) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
  retry: (id: string) => void;
  downloadResult: (id: string) => void;
  activeCount: number;
};

const Ctx = createContext<JobsCtx | null>(null);

const MAX_PARALLEL = 2;
const POLL_INTERVAL_MS = 300;
/** 连续轮询失败容忍次数 —— 超过才判定任务失败（网络抖动/后端瞬时 5xx 不立即杀任务）。 */
const POLL_MAX_ERRORS = 8;
/** 单任务总时长上限：后端挂死时释放并发槽位，避免队列永久阻塞。 */
const JOB_TIMEOUT_MS = 10 * 60_000;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef<Job[]>([]);
  jobsRef.current = jobs;

  // pump 单飞标记：同一时刻最多一个"待启动"的 pump 定时器，
  // 防止 enqueue/retry/finally 三处同时触发导致 pump 叠加空转。
  const pumpScheduled = useRef(false);
  const schedulePump = useCallback(() => {
    if (pumpScheduled.current) return;
    pumpScheduled.current = true;
    setTimeout(() => {
      pumpScheduled.current = false;
      void pumpRef.current();
    }, 0);
  }, []);

  const setJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((cur) => cur.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const pump = useCallback(async () => {
    const active = jobsRef.current.filter(
      (j) => j.status === "uploading" || j.status === "processing",
    ).length;
    if (active >= MAX_PARALLEL) return;

    const next = jobsRef.current.find((j) => j.status === "queued");
    if (!next) return;

    setJob(next.id, { status: "uploading", progress: 0 });

    try {
      // Phase 1: Upload — real XHR upload progress 0→100%
      const llmConfig = loadLLMConfig() ?? undefined;
      const { job_id } = await submitJob(next.file, next.dstFmt, (percent) => {
        setJob(next.id, { progress: percent });
      }, llmConfig);

      // Phase 2: Processing — poll backend for real step-based progress
      setJob(next.id, { status: "processing", progress: 0 });
      const fallback = `${next.filename.replace(/\.[^.]+$/, "")}.${next.dstFmt}`;
      let resultFilename = fallback;
      const deadline = Date.now() + JOB_TIMEOUT_MS;
      let pollErrors = 0;

      for (;;) {
        await sleep(POLL_INTERVAL_MS);
        if (Date.now() > deadline) {
          throw new Error("转换超时：后端长时间未完成，请减小文件后重试");
        }
        let status: JobStatusResponse;
        try {
          status = await pollJob(job_id);
          pollErrors = 0;
        } catch {
          pollErrors += 1;
          if (pollErrors >= POLL_MAX_ERRORS) {
            throw new Error("轮询转换进度失败（网络不稳定或后端不可用）");
          }
          continue;
        }

        if (status.status === "done") {
          resultFilename = status.filename ?? fallback;
          break;
        }
        if (status.status === "failed") {
          throw new Error(status.error ?? "转换失败");
        }
        setJob(next.id, { progress: status.progress });
      }

      // Phase 3: Download result
      const { blob, filename } = await downloadJobResult(job_id, resultFilename);
      const url = URL.createObjectURL(blob);
      setJob(next.id, {
        status: "done",
        progress: 100,
        resultBlobUrl: url,
        resultName: filename,
        finishedAt: Date.now(),
      });
      addHistory({
        srcName: next.filename,
        srcFmt: next.srcFmt,
        dstFmt: next.dstFmt,
        size: next.size,
        at: Date.now(),
      });
    } catch (e) {
      setJob(next.id, {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
        finishedAt: Date.now(),
      });
    } finally {
      schedulePump();
    }
  }, [setJob, schedulePump]);
  // pump 经 ref 间接递归（schedulePump 触发下一轮），避免 useCallback 依赖自身。
  const pumpRef = useRef(pump);
  pumpRef.current = pump;

  const enqueue = useCallback<JobsCtx["enqueue"]>(
    ({ file, srcFmt, dstFmt }) => {
      const job: Job = {
        id: newId(),
        file,
        filename: file.name,
        size: file.size,
        srcFmt,
        dstFmt,
        status: "queued",
        progress: 0,
        startedAt: Date.now(),
      };
      setJobs((cur) => [...cur, job]);
      schedulePump();
    },
    [schedulePump],
  );

  const remove = useCallback((id: string) => {
    setJobs((cur) => {
      const target = cur.find((j) => j.id === id);
      if (target?.resultBlobUrl) URL.revokeObjectURL(target.resultBlobUrl);
      return cur.filter((j) => j.id !== id);
    });
  }, []);

  const clearFinished = useCallback(() => {
    setJobs((cur) => {
      cur.forEach((j) => {
        if (
          (j.status === "done" || j.status === "failed") &&
          j.resultBlobUrl
        ) {
          URL.revokeObjectURL(j.resultBlobUrl);
        }
      });
      return cur.filter((j) => j.status !== "done" && j.status !== "failed");
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      setJob(id, { status: "queued", error: undefined, progress: 0 });
      schedulePump();
    },
    [schedulePump, setJob],
  );

  const downloadResult = useCallback((id: string) => {
    const job = jobsRef.current.find((j) => j.id === id);
    if (!job?.resultBlobUrl || !job.resultName) return;
    // blob URL 由 Job 持有（remove/clearFinished 时统一 revoke），这里不重复 revoke
    downloadDataUrl(job.resultBlobUrl, job.resultName);
  }, []);

  const activeCount = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status === "queued" ||
          j.status === "uploading" ||
          j.status === "processing",
      ).length,
    [jobs],
  );

  const value = useMemo<JobsCtx>(
    () => ({
      jobs,
      enqueue,
      remove,
      clearFinished,
      retry,
      downloadResult,
      activeCount,
    }),
    [jobs, enqueue, remove, clearFinished, retry, downloadResult, activeCount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJobs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJobs must be used inside <JobsProvider>");
  return ctx;
}
