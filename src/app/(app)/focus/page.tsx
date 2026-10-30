"use client";

import Link from "next/link";
import { useState } from "react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useWorkspace } from "@/lib/store/workspace-store";
import { SessionSetup } from "@/components/session/SessionSetup";
import { ActiveSession } from "@/components/session/ActiveSession";
import { gradeTone } from "@/components/session/SessionReport";
import { localDate } from "@/lib/coach/rewards";
import { gradeFor } from "@/lib/coach/summary";
import { cn, formatDuration, formatTime } from "@/lib/utils";

export default function FocusPage() {
  const { phase, settingsHydrated } = useStudyBro();
  const { loaded } = useWorkspace();
  const active = phase === "running" || phase === "paused";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Focus Session</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          {active ? "You're in a session. You can open Notes or Tasks — monitoring keeps running." : "Plan a session and StudyBro keeps you on track — and tells you how it went."}
        </p>
      </div>

      {active ? (
        <ActiveSession />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SessionSetup key={`${settingsHydrated}-${loaded}`} />
          <div className="space-y-6">
            <TodayCard />
            <HowItWorks />
          </div>
        </div>
      )}
    </div>
  );
}

function TodayCard() {
  const { history } = useStudyBro();
  const [now] = useState(() => Date.now());
  const today = localDate(now);
  const todays = history.filter((h) => h.date === today);
  const study = todays.reduce((a, h) => a + h.studyMs, 0);
  const focused = todays.reduce((a, h) => a + h.focusedMs, 0);
  const last = history.find((h) => h.endedAt);
  const pct = study ? Math.round((focused / study) * 100) : 0;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--text)]">Today</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Sessions" value={`${todays.length}`} />
        <Stat label="Time" value={study ? formatDuration(study) : "0m"} />
        <Stat label="Focused" value={study ? `${pct}%` : "—"} />
      </div>
      {last && (
        <Link href="/analytics" className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:bg-[var(--surface-2)]">
          {(() => {
            const g = gradeFor(last.studyMs ? Math.round((last.focusedMs / last.studyMs) * 100) : 0, last.studyMs);
            return <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-sm font-black text-white", gradeTone(g))}>{g}</span>;
          })()}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text)]">Last: {last.task ?? "Focus session"}</p>
            <p className="text-xs text-[var(--text-faint)]">{formatDuration(last.studyMs)} · {last.endedAt ? formatTime(last.endedAt) : ""}</p>
          </div>
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--text)]">{value}</p>
    </div>
  );
}

const STEPS = [
  { icon: "👀", title: "Gentle nudges first", desc: "Looking away or slouching gets a soft chime, not an alarm." },
  { icon: "🧠", title: "Recall Check", desc: "Drowsy, or distracted twice? Answer one question from your notes." },
  { icon: "📱", title: "Phone-down alert", desc: "Stops by itself the moment the phone leaves the frame." },
  { icon: "⏸️", title: "Auto-pause", desc: "Leave your desk and the timer pauses. Come back and it resumes." },
  { icon: "📊", title: "Session report", desc: "A grade, what distracted you, and tips for next time." },
];

function HowItWorks() {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--text)]">What happens during a session</h3>
      <ul className="mt-3 space-y-3">
        {STEPS.map((s) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-base">{s.icon}</span>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{s.title}</p>
              <p className="text-xs leading-relaxed text-[var(--text-dim)]">{s.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
