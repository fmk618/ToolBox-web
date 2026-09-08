"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { BRAND_NAME } from "../../lib/brand";
import { meta } from "./meta";
import { cn } from "../../lib/utils";

type Phase = "focus" | "short" | "long";

function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // audio not available — silent fail
  }
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function PomodoroUi() {
  const [focusMin, setFocusMin] = useState(25);
  const [shortMin, setShortMin] = useState(5);
  const [longMin, setLongMin] = useState(15);

  const [phase, setPhase] = useState<Phase>("focus");
  const [remaining, setRemaining] = useState(focusMin * 60);
  const [running, setRunning] = useState(false);
  const [cyclesDone, setCyclesDone] = useState(0);

  const phaseDuration = phase === "focus" ? focusMin : phase === "short" ? shortMin : longMin;
  const progress = 1 - remaining / (phaseDuration * 60);

  // Tick once per second when running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Tab title countdown — restore on pause/unmount
  useEffect(() => {
    const original = document.title;
    return () => { document.title = original; };
  }, []);

  useEffect(() => {
    const label = phase === "focus" ? "专注" : phase === "short" ? "短休" : "长休";
    if (running) {
      document.title = `${fmt(remaining)} · ${label} | ${BRAND_NAME}`;
    } else {
      document.title = BRAND_NAME;
    }
  }, [running, remaining, phase]);

  // A timer completion is an external event that atomically advances timer state.
  useEffect(() => {
    if (remaining !== 0 || !running) return;
    beep();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("番茄钟", {
          body: phase === "focus" ? "专注结束，休息一下" : "休息结束，继续专注",
        });
      } catch {
        /* ignore */
      }
    }
    if (phase === "focus") {
      const next = cyclesDone + 1;
      const nextPhase = next % 4 === 0 ? "long" : "short";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- timer completion transition
      setCyclesDone(next);
      setPhase(nextPhase);
      setRemaining((nextPhase === "long" ? longMin : shortMin) * 60);
    } else {
      setPhase("focus");
      setRemaining(focusMin * 60);
    }
    setRunning(false);
  }, [remaining, running, phase, cyclesDone, focusMin, shortMin, longMin]);

  function changeDuration(kind: Phase, minutes: number) {
    if (kind === "focus") setFocusMin(minutes);
    else if (kind === "short") setShortMin(minutes);
    else setLongMin(minutes);
    if (!running && phase === kind) setRemaining(minutes * 60);
  }

  function start() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setRemaining(phaseDuration * 60);
  }

  function skip() {
    setRemaining(0);
  }

  const phaseLabel = useMemo(
    () =>
      phase === "focus" ? "专注" : phase === "short" ? "短休" : "长休",
    [phase],
  );

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        {/* Big timer */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-medium",
                phase === "focus"
                  ? "bg-foreground text-background"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              )}
            >
              {phaseLabel}
            </span>
          </div>

          <div className="font-mono text-7xl font-bold tabular-nums text-foreground sm:text-8xl">
            {fmt(remaining)}
          </div>

          {/* Progress bar */}
          <div className="mx-auto mt-6 h-1.5 max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all duration-1000 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => (running ? setRunning(false) : start())}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {running ? (
                <>
                  <Pause className="h-4 w-4" /> 暂停
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> 开始
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="重置"
              title="重置"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={skip}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="跳过"
              title="跳过当前阶段"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Cycle dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i < cyclesDone % 4
                    ? "bg-foreground"
                    : "bg-muted",
                )}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              已完成 {cyclesDone} 个周期
            </span>
          </div>
        </div>

        {/* Durations */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ToolField label="专注（分钟）">
            <input
              type="number"
              min={1}
              max={120}
              value={focusMin}
              onChange={(e) =>
                changeDuration("focus", Math.max(1, Math.min(120, parseInt(e.target.value) || 25)))
              }
              disabled={running}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm disabled:opacity-50"
            />
          </ToolField>
          <ToolField label="短休（分钟）">
            <input
              type="number"
              min={1}
              max={60}
              value={shortMin}
              onChange={(e) =>
                changeDuration("short", Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))
              }
              disabled={running}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm disabled:opacity-50"
            />
          </ToolField>
          <ToolField label="长休（分钟）">
            <input
              type="number"
              min={1}
              max={60}
              value={longMin}
              onChange={(e) =>
                changeDuration("long", Math.max(1, Math.min(60, parseInt(e.target.value) || 15)))
              }
              disabled={running}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm disabled:opacity-50"
            />
          </ToolField>
        </div>
      </div>
    </ToolShell>
  );
}
