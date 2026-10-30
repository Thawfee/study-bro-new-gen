"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Play } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { MinutesBarChart, FocusLineChart, RankedBars } from "@/components/insights/Charts";
import { dailySeries, hourSeries, lapseTotals, realSessions, recordGrade, totals } from "@/lib/insights";
import { formatHour, personalFocusWindow } from "@/lib/coach/fatigue";
import { gradeTone } from "@/components/session/SessionReport";
import { cn, formatDuration } from "@/lib/utils";

export default function InsightsPage() {
  const { history, progress } = useStudyBro();
  const [range, setRange] = useState<7 | 30>(7);
  const [now] = useState(() => Date.now());

  const sessions = useMemo(() => realSessions(history), [history]);
  const inRange = useMemo(() => sessions.filter((s) => s.id >= now - range * 864e5), [sessions, range, now]);
  const t = totals(inRange);
  const days = dailySeries(inRange, range, now);
  const lapses = lapseTotals(inRange).filter((l) => l.count > 0);
  const hours = hourSeries(sessions).filter((h) => h.minutes >= 5).sort((a, b) => b.focusPct - a.focusPct).slice(0, 5);
  const win = personalFocusWindow(sessions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Insights</h1>
          <p className="mt-1 text-sm text-[var(--text-dim)]">Built only from your real sessions on this device. Demo sessions are excluded.</p>
        </div>
        <div className="inline-flex self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1" role="tablist" aria-label="Time range">
          {([7, 30] as const).map((r) => (
            <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", range === r ? "bg-[var(--bg-elev)] text-[var(--text)] shadow-sm" : "text-[var(--text-dim)]")}>
              {r === 7 ? "Last 7 days" : "Last 30 days"}
            </button>
          ))}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-dim)]"><BarChart3 size={24} /></span>
          <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">No sessions yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-dim)]">Finish a focus session of at least a minute and your charts, patterns and history show up here.</p>
          <Link href="/focus" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white"><Play size={15} fill="currentColor" /> Start a session</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Study time" value={formatDuration(t.studyMs)} />
            <Kpi label="Sessions" value={`${t.sessions}`} sub={t.sessions ? `avg ${formatDuration(t.avgSessionMs)}` : undefined} />
            <Kpi label="Focused" value={t.focusPct == null ? "—" : `${t.focusPct}%`} />
            <Kpi label="Recall accuracy" value={t.recallPct == null ? "—" : `${t.recallPct}%`} />
            <Kpi label="Avg recovery" value={t.avgRecoveryMs == null ? "—" : `${Math.max(1, Math.round(t.avgRecoveryMs / 1000))}s`} sub="after an alert" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">Study minutes per day</h2>
              <p className="mb-3 text-xs text-[var(--text-faint)]">Session time, including short look-aways</p>
              <MinutesBarChart data={days} />
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">Focus quality per day</h2>
              <p className="mb-3 text-xs text-[var(--text-faint)]">Share of session time with no distraction</p>
              <FocusLineChart data={days} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">What distracts you</h2>
              <p className="mb-4 text-xs text-[var(--text-faint)]">Times each one pulled you away</p>
              {lapses.length ? <RankedBars rows={lapses.map((l) => ({ label: l.label, value: l.count }))} /> : <p className="text-sm text-[var(--text-dim)]">Nothing recorded in this range. 🎯</p>}
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">When you focus best</h2>
              <p className="mb-4 text-xs text-[var(--text-faint)]">Focus % by session start time (all time)</p>
              {hours.length ? <RankedBars rows={hours.map((h) => ({ label: formatHour(h.hour), value: h.focusPct }))} unit="%" /> : <p className="text-sm text-[var(--text-dim)]">Needs a few more sessions at different times.</p>}
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">Your focus pattern</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Focus window" value={win.personal ? `~${win.minutes} min` : `learning (${win.samples}/3)`} />
                <Row label="Best streak" value={formatDuration(progress.bestStreakMs)} />
                <Row label="Breaks taken" value={`${progress.breaksTaken}`} />
                <Row label="Doubts saved" value={`${progress.doubtsLogged}`} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[var(--text-dim)]">
                Focus window = median minutes until your first live lapse. StudyBro uses it to predict fatigue and suggest breaks before you crash.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Session history</h2>
              <span className="text-xs text-[var(--text-faint)]">{inRange.length} in range</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-y border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
                    <th className="px-5 py-2 font-medium">Grade</th>
                    <th className="px-3 py-2 font-medium">Task</th>
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 text-right font-medium">Time</th>
                    <th className="px-3 py-2 text-right font-medium">Focused</th>
                    <th className="px-5 py-2 text-right font-medium">Lapses</th>
                  </tr>
                </thead>
                <tbody>
                  {inRange.slice(0, 25).map((r) => {
                    const g = recordGrade(r);
                    const lapseN = Object.values(r.lapseCounts ?? {}).reduce((a, v) => a + (v ?? 0), 0);
                    return (
                      <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-5 py-2.5"><span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-xs font-black text-white", gradeTone(g))}>{g}</span></td>
                        <td className="max-w-[16rem] truncate px-3 py-2.5 text-[var(--text)]">{r.task ?? "Focus session"}<span className="ml-2 text-xs text-[var(--text-faint)]">{r.subject}</span></td>
                        <td className="px-3 py-2.5 text-[var(--text-dim)]">{new Date(r.id).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[var(--text)]">{formatDuration(r.studyMs)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[var(--text)]">{r.studyMs ? Math.round((r.focusedMs / r.studyMs) * 100) : 0}%</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-[var(--text-dim)]">{lapseN}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text)]">{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-faint)]">{sub}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="font-semibold tabular-nums text-[var(--text)]">{value}</span>
    </div>
  );
}
