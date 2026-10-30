"use client";

import Link from "next/link";
import { ArrowLeft, Play, ShieldCheck, Square } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useCameraControl } from "@/components/camera/CameraProvider";
import { CameraSlot, LiveSignals } from "@/components/camera/CameraSlot";
import { JudgeDemoPanel } from "@/components/dashboard/JudgeDemoPanel";
import { AIExplanationPanel } from "@/components/dashboard/AIExplanationPanel";
import { SessionTimeline } from "@/components/session/SessionTimeline";
import { clockText, deriveStudyState, sessionClock } from "@/lib/study-state";
import { TONE } from "@/lib/tone";
import { cn } from "@/lib/utils";

const LADDER = [
  { key: "nudge", icon: "👀", title: "Nudge", desc: "Soft chime for a look-away or slouch" },
  { key: "quiz", icon: "🧠", title: "Recall Check", desc: "Question from your own notes" },
  { key: "alarm", icon: "⏰", title: "Alarm", desc: "Wake-up / phone-down, auto-clears" },
  { key: "pause", icon: "⏸️", title: "Auto-pause", desc: "Left the desk → timer pauses" },
  { key: "coach", icon: "🧘", title: "Coach", desc: "Break before fatigue, help when stuck" },
];

export default function ExpoPage() {
  const s = useStudyBro();
  const { focus, detections, intervention, phase, plan, session, pauseReason, mode, toasts, helpPrompt, breakSuggestion, fatigue, streak, sessionQuiz } = s;
  const camera = useCameraControl();
  const state = deriveStudyState({ phase, pauseReason, detections, intervention, score: focus.score, cameraLive: mode === "live" });
  const clock = sessionClock(session.metrics.studyTimeMs, plan?.durationMin ?? null);
  const active = phase === "running" || phase === "paused";

  const ladderActive =
    intervention?.kind === "quiz" && !(intervention.type === "drowsiness" && intervention.conditionClearedAt == null && mode === "live") ? "quiz" :
    intervention ? "alarm" :
    pauseReason === "away" ? "pause" :
    helpPrompt || breakSuggestion ? "coach" :
    toasts.length ? "nudge" : null;

  const startLive = async () => {
    if (!active) s.startSession({ task: "Expo live demo", taskId: null, subject: "Demo", durationMin: null, camera: true });
    if (!camera.active) await camera.start();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-3 sm:p-5">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/focus" className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)]" aria-label="Exit Expo Mode"><ArrowLeft size={18} /></Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)] sm:text-2xl">StudyBro AI</h1>
              <p className="text-xs text-[var(--text-dim)] sm:text-sm">An AI study coach that notices when focus slips — and helps you get it back.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-[var(--good)]"><ShieldCheck size={14} /> 100% on-device · nothing recorded</span>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="card p-4">
            <CameraSlot />
            {camera.active ? (
              <LiveSignals className="mt-3" />
            ) : (
              <p className="mt-3 text-center text-xs text-[var(--text-faint)]">Turn the camera on for live AI, or run the scripted judge walkthrough below.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Study state</p>
              <p className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xl font-bold", TONE[state.tone].bg, TONE[state.tone].text)}>{state.emoji} {state.label}</p>
              <p className="mt-2 text-sm text-[var(--text-dim)]">{state.detail}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Big label="Focus score" value={`${focus.score}`} />
                <Big label={clock.countdown ? "Remaining" : "Session"} value={active ? clockText(clock.mainMs) : "—"} />
                <Big label="Fatigue" value={`${fatigue.risk}%`} />
                <Big label="Streak" value={active ? clockText(streak.currentMs) : "—"} />
                <Big label="Recall" value={`${sessionQuiz.correct}/${sessionQuiz.total}`} />
                <Big label="Camera" value={mode === "live" ? "Live" : "Off"} />
              </div>
              <div className="mt-5 flex justify-center gap-2">
                {!active || !camera.active ? (
                  <button onClick={startLive} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white"><Play size={15} fill="currentColor" /> Start live demo</button>
                ) : null}
                {active && (
                  <button onClick={s.endSession} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--text)]"><Square size={13} fill="currentColor" /> End & show report</button>
                )}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">How StudyBro responds</p>
              <ol className="mt-3 space-y-2">
                {LADDER.map((l, i) => (
                  <li key={l.key} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors", ladderActive === l.key ? "border-[var(--brand)] bg-violet-500/12" : "border-[var(--border)] bg-[var(--surface)]")}>
                    <span className="w-5 text-xs tabular-nums text-[var(--text-faint)]">{i + 1}</span>
                    <span className="text-lg">{l.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--text)]">{l.title}</span>
                      <span className="block truncate text-xs text-[var(--text-dim)]">{l.desc}</span>
                    </span>
                    {ladderActive === l.key && <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <JudgeDemoPanel compact />

        <div className="grid gap-4 xl:grid-cols-2">
          <SessionTimeline limit={6} />
          <AIExplanationPanel />
        </div>
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--text)]">{value}</p>
    </div>
  );
}
