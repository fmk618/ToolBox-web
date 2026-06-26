export function ProgressBar({
  percent,
  status,
}: {
  percent: number; // -1 for indeterminate
  status: "uploading" | "processing" | "done" | "failed" | "queued" | "canceled";
}) {
  if (status === "done") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-full bg-green-500" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-full bg-red-500" />
      </div>
    );
  }
  if (status === "queued") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" />
    );
  }
  // Real progress (uploading or processing with known percent)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full bg-blue-500 transition-[width] duration-300 ease-out"
        style={{ width: `${Math.max(0, percent)}%` }}
      />
    </div>
  );
}
