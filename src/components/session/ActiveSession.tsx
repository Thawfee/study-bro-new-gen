"use client";

import { Coffee, Pause, Play, Square } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useCameraControl } from "@/components/camera/CameraProvider";
import { CameraSlot, LiveSignals } from "@/components/camera/CameraSlot";
import { SessionTimeline } from "./SessionTimeline";
import { DemoControlPanel } from "@/components/dashboard/DemoControlPanel";
import { clockText, deriveStudyState, sessionClock } from "@/lib/study-state";
import { TONE } from "@/lib/tone";
import { cn, formatDuration } from "@/lib/utils";

function TimerRing({ progress, children, tone }: { progress: number | null; children: React.ReactNode; tone: string }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const p = progress ?? 0;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[17rem]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        {progress != null && (
          <circle cx="100" cy="100" r={r} fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function ActiveSession() {
  const s = useStudyBro();
  const { phase, plan, session, focus, streak, fatigue, pauseReason, detections, intervention, mode, breakState } = s;
  const camera = useCameraControl();
  const clock = sessionClock(session.metrics.studyTimeMs, plan?.durationMin ?? null);
  const state = deriveStudyState({ phase, pauseReason, detections, intervention, score: focus.score, cameraLive: mode === "live" });
  const focusPct = session.metrics.studyTimeMs > 0 ? Math.round((session.metrics.focusedTimeMs / session.metrics.studyTimeMs) * 100) : 100;
  const paused = phase === "paused";
  const ringColor = paused ? "var(--warn)" : state.tone === "bad" ? "var(--bad)" : state.tone === "warn" ? "var(--warn)" : "var(--brand)";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Timer + controls */}
        <div className="card flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{plan?.demo ? "Demo session" : "Now studying"}</p>
              <h2 className="truncate text-lg font-semibold text-[var(--text)]">{plan?.task}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-dim)]">{plan?.subject}</span>
          </div>

          <div className="my-6">
            <TimerRing progress={clock.progress} tone={ringColor}>
              <p className="text-5xl font-bold tabular-nums tracking-tight text-[var(--text)] sm:text-6xl">{clockText(clock.mainMs)}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">{clock.countdown ? "remaining" : "elapsed"}</p>
              <p className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", TONE[state.tone].bg, TONE[state.tone].text)}>
                <span>{state.emoji}</span> {state.label}
              </p>
            </TimerRing>
            <p className="mt-2 text-center text-xs text-[var(--text-dim)]">{state.detail}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {paused ? (
              <button
                onClick={breakState ? s.endBreak : s.resumeSession}
                className="col-span-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-sm font-semibold text-white hover:brightness-110"
              >
                <Play size={16} fill="currentColor" /> {breakState ? "End break" : "Resume"}
              </button>
            ) : (
              <button onClick={s.pauseSession} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
                <Pause size={16} /> Pause
              </button>
            )}
            <button
              onClick={s.startBreak}
              disabled={!!breakState || !!intervention}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-40"
            >
              <Coffee size={16} /> Break
            </button>
            <button onClick={s.endSession} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-[var(--bad)] hover:bg-rose-500/15">
              <Square size={14} fill="currentColor" /> End
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini label="Focused" value={`${focusPct}%`} />
            <Mini label="Score" value={`${focus.score}`} />
            <Mini label="Streak" value={formatDuration(streak.currentMs)} />
            <Mini label="Fatigue" value={`${fatigue.risk}%`} tone={fatigue.risk >= 70 ? "text-[var(--bad)]" : fatigue.risk >= 40 ? "text-[var(--warn)]" : undefined} />
          </div>
        </div>

        {/* Camera */}
        <div className="card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)]">AI camera</h3>
            <span className={cn("text-xs font-medium", mode === "live" ? "text-[var(--good)]" : "text-[var(--text-faint)]")}>{mode === "live" ? "● Live" : camera.status === "requesting" ? "Starting…" : camera.active ? (camera.live.status === "error" ? "AI offline" : "Starting AI…") : "Off"}</span>
          </div>
          <CameraSlot />
          {camera.active && <LiveSignals className="mt-3" />}
          {!camera.active && (
            <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 [&_summary]:cursor-pointer">
              <summary className="text-xs font-medium text-[var(--text-dim)]">Presenting without a camera? Demo tools</summary>
              <div className="mt-3"><DemoControlPanel compact /></div>
            </details>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <SessionTimeline limit={8} />
        <CoachNow />
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums text-[var(--text)]", tone)}>{value}</p>
    </div>
  );
}

/** Live coach card: fatigue prediction with its reasons. */
function CoachNow() {
  const { fatigue, sessionQuiz, progress } = useStudyBro();
  const bar = fatigue.risk >= 70 ? "bg-rose-400" : fatigue.risk >= 40 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--text)]">Coach</h3>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Fatigue risk</p>
          <p className="text-3xl font-bold tabular-nums text-[var(--text)]">{fatigue.risk}%</p>
        </div>
        <p className="text-right text-xs text-[var(--text-dim)]">
          {fatigue.level === "BREAK_RECOMMENDED" ? "Break recommended now" : <>Break suggested in ~<strong className="text-[var(--text)]">{fatigue.minutesToBreak} min</strong></>}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className={cn("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${fatigue.risk}%` }} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {fatigue.reasons.length === 0 ? (
          <li className="text-xs text-[var(--text-faint)]">No fatigue signals yet — you&apos;re fresh.</li>
        ) : (
          fatigue.reasons.slice(0, 3).map((r) => (
            <li key={r.label} className="flex justify-between gap-3 text-xs">
              <span className="truncate text-[var(--text-dim)]">{r.label}</span>
              <span className="tabular-nums text-[var(--text-faint)]">+{r.points}</span>
            </li>
          ))
        )}
      </ul>
      <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-dim)]">
        {fatigue.windowPersonal ? `Your personal focus window: ~${fatigue.windowMinutes} min.` : `Learning your focus window (${fatigue.windowSamples}/3 live blocks).`}
        {" "}Recall checks: {sessionQuiz.correct}/{sessionQuiz.total} · {progress.xp} XP total.
      </p>
    </div>
  );
}
