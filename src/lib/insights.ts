/* Aggregations over saved session history (real data only, demo sessions excluded). */

import type { SessionRecord } from "@/types/coach";
import { localDate } from "@/lib/coach/rewards";
import { gradeFor } from "@/lib/coach/summary";

export function realSessions(history: SessionRecord[]): SessionRecord[] {
  return history.filter((h) => !h.demo && h.studyMs >= 60_000);
}

export interface DayPoint {
  date: string;
  label: string;
  minutes: number;
  focusPct: number | null;
  sessions: number;
}

export function dailySeries(history: SessionRecord[], days: number, now = Date.now()): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = now - i * 864e5;
    const date = localDate(ts);
    const recs = history.filter((h) => h.date === date);
    const study = recs.reduce((a, r) => a + r.studyMs, 0);
    const focused = recs.reduce((a, r) => a + r.focusedMs, 0);
    out.push({
      date,
      label: new Date(ts).toLocaleDateString([], days <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" }),
      minutes: Math.round(study / 60_000),
      focusPct: study ? Math.round((focused / study) * 100) : null,
      sessions: recs.length,
    });
  }
  return out;
}

export function totals(history: SessionRecord[]) {
  const study = history.reduce((a, r) => a + r.studyMs, 0);
  const focused = history.reduce((a, r) => a + r.focusedMs, 0);
  const quizT = history.reduce((a, r) => a + r.quizTotal, 0);
  const quizC = history.reduce((a, r) => a + r.quizCorrect, 0);
  const recs = history.filter((r) => r.avgRecoveryMs != null);
  return {
    sessions: history.length,
    studyMs: study,
    focusPct: study ? Math.round((focused / study) * 100) : null,
    avgSessionMs: history.length ? study / history.length : 0,
    recallPct: quizT ? Math.round((quizC / quizT) * 100) : null,
    avgRecoveryMs: recs.length ? recs.reduce((a, r) => a + (r.avgRecoveryMs ?? 0), 0) / recs.length : null,
  };
}

export const LAPSE_LABELS: Record<string, string> = {
  phone: "Phone",
  distraction: "Looking away",
  drowsiness: "Drowsiness",
  tab: "Other tabs",
  posture: "Posture",
  away: "Left desk",
};

export function lapseTotals(history: SessionRecord[]) {
  const acc: Record<string, number> = {};
  for (const r of history) for (const [k, v] of Object.entries(r.lapseCounts ?? {})) acc[k] = (acc[k] ?? 0) + (v ?? 0);
  return Object.entries(LAPSE_LABELS)
    .map(([k, label]) => ({ key: k, label, count: acc[k] ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export function hourSeries(history: SessionRecord[]) {
  const buckets = new Map<number, { study: number; focused: number }>();
  for (const r of history) {
    const b = buckets.get(r.hour) ?? { study: 0, focused: 0 };
    b.study += r.studyMs;
    b.focused += r.focusedMs;
    buckets.set(r.hour, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, b]) => ({ hour, label: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "a" : "p"}`, minutes: Math.round(b.study / 60_000), focusPct: b.study ? Math.round((b.focused / b.study) * 100) : 0 }));
}

export function recordGrade(r: SessionRecord): string {
  return gradeFor(r.studyMs ? Math.round((r.focusedMs / r.studyMs) * 100) : 0, r.studyMs);
}
