"use client";

import Link from "next/link";
import { Inbox, Trash2 } from "lucide-react";
import { useJobs } from "../../lib/jobs";
import { JobRow } from "../../components/queue/job-row";

export default function QueuePage() {
  const { jobs, clearFinished, retry, remove, downloadResult } = useJobs();

  const active = jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "uploading" ||
      j.status === "processing",
  );
  const done = jobs.filter((j) => j.status === "done");
  const failed = jobs.filter((j) => j.status === "failed");

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-950">
          <Inbox className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
            队列为空
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            前往{" "}
            <Link
              href="/"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              转换页
            </Link>{" "}
            添加任务
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="进行中" value={active.length} color="text-blue-600" />
        <StatTile label="已完成" value={done.length} color="text-green-600" />
        <StatTile label="失败" value={failed.length} color="text-red-600" />
      </div>

      {active.length > 0 && (
        <Group title="进行中" count={active.length}>
          {active.map((j) => (
            <JobRow
              key={j.id}
              job={j}
              onRetry={() => retry(j.id)}
              onRemove={() => remove(j.id)}
              onDownload={() => downloadResult(j.id)}
            />
          ))}
        </Group>
      )}

      {failed.length > 0 && (
        <Group title="失败" count={failed.length}>
          {failed.map((j) => (
            <JobRow
              key={j.id}
              job={j}
              onRetry={() => retry(j.id)}
              onRemove={() => remove(j.id)}
              onDownload={() => downloadResult(j.id)}
            />
          ))}
        </Group>
      )}

      {done.length > 0 && (
        <Group
          title="已完成"
          count={done.length}
          action={
            <button
              onClick={clearFinished}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清空已完成
            </button>
          }
        >
          {done.map((j) => (
            <JobRow
              key={j.id}
              job={j}
              onRetry={() => retry(j.id)}
              onRemove={() => remove(j.id)}
              onDownload={() => downloadResult(j.id)}
            />
          ))}
        </Group>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold sm:text-2xl ${color}`}>
        {value}
      </div>
    </div>
  );
}

function Group({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {title}{" "}
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-px text-xs font-normal text-slate-500 dark:bg-slate-800">
            {count}
          </span>
        </h2>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
