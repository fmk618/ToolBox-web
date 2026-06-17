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
import { convertFile } from "./api";
import { addHistory } from "./history";

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

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef<Job[]>([]);
  jobsRef.current = jobs;

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
      const { blob, filename } = await convertFile(
        next.file,
        next.dstFmt,
        (percent) => {
          // While upload is in flight, show real percentage.
          setJob(next.id, { progress: percent });
          if (percent >= 100) {
            // Switch to indeterminate "server processing" phase.
            setJob(next.id, { status: "processing", progress: -1 });
          }
        },
      );
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
      // Schedule next pump tick.
      setTimeout(() => void pump(), 0);
    }
  }, [setJob]);

  const enqueue = useCallback<JobsCtx["enqueue"]>(
    ({ file, srcFmt, dstFmt }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const job: Job = {
        id,
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
      setTimeout(() => void pump(), 0);
    },
    [pump],
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
      setTimeout(() => void pump(), 0);
    },
    [pump, setJob],
  );

  const downloadResult = useCallback((id: string) => {
    const job = jobsRef.current.find((j) => j.id === id);
    if (!job?.resultBlobUrl || !job.resultName) return;
    const a = document.createElement("a");
    a.href = job.resultBlobUrl;
    a.download = job.resultName;
    a.click();
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
