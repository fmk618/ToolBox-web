"use client";

import {
  ArrowRight,
  Clock,
  FileText,
  History as HistoryIcon,
  Trash2,
} from "lucide-react";
import { clearHistory, useHistory } from "../../lib/history";
import { fmtMeta } from "../../lib/formats";

function relativeTime(at: number): string {
  const sec = Math.floor((Date.now() - at) / 1000);
  if (sec < 60) return `${sec} 秒前`;
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`;
  return new Date(at).toLocaleString("zh-CN");
}

export default function HistoryPage() {
  const list = useHistory();

  if (!list.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center sm:py-20 dark:border-slate-800 dark:bg-slate-950">
          <HistoryIcon className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
            暂无转换记录
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            历史记录保存在浏览器本地，最多 50 条
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500 sm:text-sm">
          共 {list.length} 条记录（最近 50 次）
        </div>
        <button
          onClick={() => {
            if (confirm("确认清空所有历史记录？")) clearHistory();
          }}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Trash2 className="h-3.5 w-3.5" />
          清空全部
        </button>
      </div>

      {/* Mobile card list (<md) */}
      <div className="space-y-2 md:hidden">
        {list.map((e, i) => {
          const a = fmtMeta(e.srcFmt);
          const b = fmtMeta(e.dstFmt);
          return (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-700 dark:text-slate-200">
                    {e.srcName}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-xs">
                    <span className={`font-medium ${a.color}`}>{a.label}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className={`font-medium ${b.color}`}>{b.label}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>{(e.size / 1024).toFixed(1)} KB</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {relativeTime(e.at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium">文件</th>
              <th className="px-4 py-3 text-left font-medium">转换</th>
              <th className="px-4 py-3 text-right font-medium">大小</th>
              <th className="px-4 py-3 text-right font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e, i) => {
              const a = fmtMeta(e.srcFmt);
              const b = fmtMeta(e.dstFmt);
              return (
                <tr
                  key={i}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-slate-700 dark:text-slate-200">
                        {e.srcName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`font-medium ${a.color}`}>
                        {a.label}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className={`font-medium ${b.color}`}>
                        {b.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {(e.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeTime(e.at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
