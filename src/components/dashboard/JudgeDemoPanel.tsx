"use client";

import { useEffect, useState } from "react";
import { Play, Square, Sparkles } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import type { DetectionType } from "@/types/ai";
import { cn } from "@/lib/utils";

type Step = { title: string; detail: string; type?: DetectionType; coach?: "confusion" | "break" | "end"; ms: number };

const STEPS: Step[] = [
  { title: "Look away", detail: "First look-away → a gentle nudge, not an alarm.", type: "distraction", ms: 3500 },
  { title: "Look away again", detail: "Second within 3 min → Recall Check from the notes.", type: "distraction", ms: 5000 },
  { title: "Phone appears", detail: "Phone-down alarm that clears itself.", type: "phone", ms: 4000 },
  { title: "Eyes close", detail: "Wake-up alarm, then a recall question.", type: "drowsiness", ms: 5000 },
  { title: "Student leaves", detail: "Timer auto-pauses and resumes on return.", type: "away", ms: 6500 },
  { title: "Looks stuck", detail: "Furrowed brow → help, never a penalty.", coach: "confusion", ms: 4000 },
  { title: "Getting tired", detail: "Fatigue prediction suggests a break early.", coach: "break", ms: 4000 },
  { title: "Session report", detail: "Grade, distractions and coach tips.", coach: "end", ms: 1000 },
];

/** Scripted, clearly-labelled simulation for judges when no camera is used. */
export function JudgeDemoPanel({ compact = false }: { compact?: boolean }) {
  const s = useStudyBro();
  const { mode } = s;
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    const cur = STEPS[step];
    s.resolveIntervention();
    s.resolveHelp("dismiss");
    s.dismissBreakSuggestion();
    if (cur.type) s.trigger(cur.type);
    if (cur.coach === "confusion") s.reportConfusion("demo");
    if (cur.coach === "break") s.suggestBreak();
    if (cur.coach === "end") s.endSession();
    const id = window.setTimeout(() => {
      if (step >= STEPS.length - 1) setRunning(false);
      else setStep((n) => n + 1);
    }, cur.ms);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  const start = () => {
    if (mode === "live") return;
    if (s.phase === "summary") s.closeSummary();
    if (s.phase !== "running" && s.phase !== "paused") {
      s.startSession({ task: "Judge demo", taskId: null, subject: "Demo", durationMin: null, camera: false, demo: true });
    }
    setStep(0);
    setRunning(true);
  };
  const stop = () => { setRunning(false); s.resolveIntervention(); };

  return (
    <div className={compact ? "rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4" : "card p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warn)]"><Sparkles size={13} /> Simulated demo</p>
          <h3 className="mt-0.5 text-sm font-semibold text-[var(--text)]">Judge walkthrough</h3>
          <p className="text-xs text-[var(--text-dim)]">{mode === "live" ? "Turn the camera off to run the scripted demo." : "Plays the full alert ladder in ~35 seconds. Never shown as live AI."}</p>
        </div>
        {running ? (
          <button onClick={stop} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-[var(--bad)]"><Square size={13} /> Stop</button>
        ) : (
          <button onClick={start} disabled={mode === "live"} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-black disabled:opacity-40"><Play size={13} fill="currentColor" /> Run demo</button>
        )}
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((st, i) => (
          <li key={st.title} className={cn("rounded-xl border px-3 py-2.5", running && i === step ? "border-amber-400/50 bg-amber-500/15" : running && i < step ? "border-emerald-400/25 bg-emerald-500/5" : "border-[var(--border)] bg-[var(--surface)]")}>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Step {i + 1}</p>
            <p className="text-xs font-semibold text-[var(--text)]">{st.title}</p>
            {!compact && <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-dim)]">{st.detail}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
