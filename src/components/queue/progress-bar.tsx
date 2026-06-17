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
  if (percent < 0 || status === "processing") {
    // indeterminate striped animation
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-1/3 animate-[indeterminate_1.4s_infinite_linear] rounded-full bg-blue-500" />
        <style jsx>{`
          @keyframes indeterminate {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full bg-blue-500 transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
