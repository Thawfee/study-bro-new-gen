"use client";

import { Camera, CameraOff, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useCameraControl } from "./CameraProvider";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tone";
import { TONE } from "@/lib/tone";

/**
 * Where the live camera appears on a page. The persistent camera dock
 * positions itself exactly over this box while the camera is on.
 */
export function CameraSlot({ className, compactControls = false }: { className?: string; compactControls?: boolean }) {
  const { status, error, active, start, stop, recalibrate, live } = useCameraControl();

  return (
    <div className={cn("space-y-2", className)}>
      <div data-camera-slot={active ? "" : undefined} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black">
        {!active && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            {status === "requesting" ? (
              <div className="flex flex-col items-center gap-3 text-slate-300">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm">Waiting for camera permission…</p>
              </div>
            ) : status === "denied" || status === "unavailable" || status === "error" ? (
              <div className="flex max-w-xs flex-col items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-300"><ShieldAlert size={20} /></span>
                <p className="text-sm font-medium text-slate-100">Camera not available</p>
                <p className="text-xs text-slate-400">{error} You can still study — the timer, tab tracking and Recall Checks keep working.</p>
                <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15">
                  <Camera size={15} /> Try again
                </button>
              </div>
            ) : (
              <div className="flex max-w-xs flex-col items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white"><Camera size={22} /></span>
                <p className="text-sm font-medium text-slate-100">AI camera is off</p>
                <p className="text-xs leading-relaxed text-slate-400">Turn it on to detect drowsiness, phone use, look-aways and when you step away.</p>
                <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                  <Camera size={15} /> Turn on camera
                </button>
                <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90"><ShieldCheck size={12} /> Processed on this device. Nothing is recorded.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {active && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--text-faint)]">
            {live.status === "running" ? (live.calibrating ? "Calibrating…" : `On-device AI · ${live.fps} FPS · nothing recorded`) : "Starting AI…"}
          </p>
          <div className="flex gap-1.5">
            <button onClick={recalibrate} title="Re-learn your neutral position" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]">
              <RefreshCw size={13} /> {compactControls ? "" : "Recalibrate"}
            </button>
            <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]">
              <CameraOff size={13} /> {compactControls ? "" : "Camera off"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** Compact live signal chips under the camera. */
export function LiveSignals({ className }: { className?: string }) {
  const { live, active } = useCameraControl();
  const running = active && live.status === "running" && !live.calibrating;

  const items: { label: string; value: string; tone: Tone }[] = [
    { label: "Eyes", value: !running || !live.face ? "—" : live.eyesClosed ? "Closed" : "Open", tone: !running ? "neutral" : live.eyesClosed ? "bad" : "good" },
    { label: "Alertness", value: !running ? "—" : live.drowsy === "NORMAL" ? "Alert" : cap(live.drowsy), tone: !running ? "neutral" : live.drowsy === "CRITICAL" ? "bad" : live.drowsy === "WARNING" ? "warn" : "good" },
    { label: "Gaze", value: !running || !live.face ? "—" : live.gaze === "FOCUSED" ? "On screen" : `${cap(live.gazeDirection)}`, tone: !running ? "neutral" : live.gaze === "DISTRACTED" ? "bad" : live.gaze === "SLIGHTLY_DISTRACTED" ? "warn" : "good" },
    { label: "Phone", value: !running ? "—" : live.phone ? "Detected" : "None", tone: !running ? "neutral" : live.phone ? "bad" : "good" },
    { label: "Posture", value: !running ? "—" : live.postureReason ?? cap(live.posture), tone: !running ? "neutral" : live.posture === "BAD" ? "bad" : live.posture === "WARNING" ? "warn" : "good" },
    { label: "Thinking", value: !running ? "—" : live.confusion === "PUZZLED" ? "Stuck?" : live.confusion === "THINKING" ? "Thinking" : "Clear", tone: !running ? "neutral" : live.confusion === "PUZZLED" ? "warn" : "good" },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6", className)}>
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-faint)]">{it.label}</p>
          <p className={cn("mt-0.5 truncate text-xs font-semibold", TONE[it.tone].text)}>{it.value}</p>
        </div>
      ))}
    </div>
  );
}
