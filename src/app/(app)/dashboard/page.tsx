"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Lightbulb, Play, Plus, Target } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useWorkspace } from "@/lib/store/workspace-store";
import { TaskRow } from "@/components/tasks/TaskRow";
import { MinutesBarChart } from "@/components/insights/Charts";
import { deriveCards, dueIds, useCardStates } from "@/lib/coach/cards";
import { dayStreak, levelFromXp, localDate } from "@/lib/coach/rewards";
import { formatHour, hourInsights, personalFocusWindow } from "@/lib/coach/fatigue";
import { dailySeries, realSessions } from "@/lib/insights";
import { clockText, sessionClock } from "@/lib/study-state";
import { cn, formatDuration, greeting } from "@/lib/utils";

export default function HomePage() {
  const { history, progress, phase, plan, session } = useStudyBro();
  const { tasks, goals, notes, profile, toggleTask, addTask } = useWorkspace();
  const states = useCardStates();
  const [now] = useState(() => Date.now());
  const [quick, setQuick] = useState("");

  const sessions = useMemo(() => realSessions(history), [history]);
  const today = localDate(now);
  const todays = sessions.filter((s) => s.date === today);
  const studyToday = todays.reduce((a, s) => a + s.studyMs, 0);
  const focusedToday = todays.reduce((a, s) => a + s.focusedMs, 0);
  const week = dailySeries(sessions, 7, now);
  const weekMin = week.reduce((a, d) => a + d.minutes, 0);
  const cards = useMemo(() => deriveCards(notes), [notes]);
  const due = dueIds(cards, states, now).length;
  const open = tasks.filter((t) => !t.done);
  const lvl = levelFromXp(progress.xp);
  const streak = dayStreak(progress.studyDays, now);
  const active = phase === "running" || phase === "paused";

  const win = personalFocusWindow(sessions);
  const best = hourInsights(sessions)[0];
  const tip = best
    ? `You focus best when you start around ${formatHour(best.hour)} (${Math.round(best.focusRatio * 100)}% focused).`
    : win.personal
      ? `You usually stay locked in for ~${win.minutes} minutes. Plan a short break around then.`
      : "Finish a few camera sessions and StudyBro will learn your personal focus window and best study hours.";

  const subtitle = [
    open.length ? `${open.length} open task${open.length === 1 ? "" : "s"}` : null,
    due ? `${due} card${due === 1 ? "" : "s"} to review` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[var(--text-faint)]">{new Date(now).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{greeting(new Date(now))}, {profile.name === "Study Bro" ? "Bro" : profile.name.split(" ")[0]} 👋</h1>
          {subtitle && <p className="mt-1 text-sm text-[var(--text-dim)]">{subtitle}</p>}
        </div>
        {!active && (
          <Link href="/focus" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/30 hover:brightness-110">
            <Play size={17} fill="currentColor" /> Start focus session
          </Link>
        )}
      </div>

      {active && (
        <Link href="/focus" className="card flex items-center gap-4 border-emerald-400/30 p-4 hover:bg-[var(--surface-2)]">
          <span className={cn("h-3 w-3 shrink-0 rounded-full", phase === "running" ? "animate-pulse bg-emerald-400" : "bg-amber-400")} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text)]">{phase === "running" ? "Session in progress" : "Session paused"} — {plan?.task}</p>
            <p className="text-xs text-[var(--text-dim)]">
              {(() => { const c = sessionClock(session.metrics.studyTimeMs, plan?.durationMin ?? null); return `${clockText(c.mainMs)} ${c.countdown ? "left" : "elapsed"}`; })()}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-text)]">Open <ArrowRight size={15} /></span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Studied today" value={studyToday ? formatDuration(studyToday) : "0m"} sub={todays.length ? `${todays.length} session${todays.length === 1 ? "" : "s"}` : "No sessions yet"} />
        <Kpi label="Focus today" value={studyToday ? `${Math.round((focusedToday / studyToday) * 100)}%` : "—"} sub="of session time" />
        <Kpi label="Day streak" value={`${streak} day${streak === 1 ? "" : "s"}`} sub={streak ? "Keep it alive 🔥" : "Study 5+ min to start"} />
        <Kpi label={`Level ${lvl.level}`} value={lvl.name} sub={`${progress.xp} / ${lvl.next} XP`} progress={lvl.progress} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text)]">This week</h2>
                <p className="text-xs text-[var(--text-faint)]">{weekMin} minutes studied</p>
              </div>
              <Link href="/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-text)] hover:underline">Insights <ArrowRight size={13} /></Link>
            </div>
            <div className="mt-3">
              {weekMin ? <MinutesBarChart data={week} height={190} /> : <p className="grid h-[150px] place-items-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-faint)]">Your study minutes will appear here.</p>}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Up next</h2>
              <Link href="/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-text)] hover:underline">All tasks <ArrowRight size={13} /></Link>
            </div>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!quick.trim()) return;
                addTask({ title: quick.trim(), subject: "General", priority: "medium", dueDate: today });
                setQuick("");
              }}
            >
              <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Add a task for today…" className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]" />
              <button type="submit" aria-label="Add task" className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--brand)] hover:text-white"><Plus size={18} /></button>
            </form>
            {open.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-faint)]">All clear. Nothing pending. 🎉</p>
            ) : (
              <div className="space-y-2">
                {open.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} />)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[var(--brand-text)]" />
              <h2 className="text-sm font-semibold text-[var(--text)]">Review</h2>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-[var(--text)]">{due}<span className="ml-1 text-sm font-medium text-[var(--text-faint)]">due of {cards.length}</span></p>
            <Link href="/review" className={cn("mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold", due ? "bg-[var(--brand)] text-white hover:brightness-110" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]")}>
              {due ? "Review now" : "Open deck"}
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[var(--warn)]" />
              <h2 className="text-sm font-semibold text-[var(--text)]">Coach tip</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">{tip}</p>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-[var(--good)]" />
                <h2 className="text-sm font-semibold text-[var(--text)]">Goals</h2>
              </div>
              <Link href="/goals" className="text-xs font-medium text-[var(--brand-text)] hover:underline">Manage</Link>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">No goals yet.</p>
            ) : (
              <ul className="space-y-3">
                {goals.slice(0, 4).map((g) => {
                  const p = g.target ? Math.min(1, g.current / g.target) : 0;
                  return (
                    <li key={g.id}>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate text-[var(--text)]">{g.title}</span>
                        <span className="shrink-0 tabular-nums text-[var(--text-faint)]">{g.current}/{g.target} {g.unit}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div className={cn("h-full rounded-full", p >= 1 ? "bg-emerald-400" : "bg-[var(--brand)]")} style={{ width: `${p * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, progress }: { label: string; value: string; sub?: string; progress?: number }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold tabular-nums text-[var(--text)] sm:text-2xl">{value}</p>
      {sub && <p className="truncate text-[11px] text-[var(--text-faint)]">{sub}</p>}
      {progress != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
