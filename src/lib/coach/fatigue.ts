/* ============================================================
   Fatigue predictor — an explainable, personal model.

   Not a trained neural net and not a medical measure. It adds up
   transparent "risk points" so every number on screen can be
   explained to a judge:

     time on task vs. YOUR focus window  (up to ~60)
     recent lapses (last 10 min)         (up to 35)
     eyes currently closing              (+10)
     low focus score                     (up to 10)
     historically weak hour of the day   (+8)

   Your focus window = median minutes from session start / break
   to the first live lapse, across your own saved sessions.
   ============================================================ */

import type { DetectionType } from "@/types/ai";
import type { FatigueEstimate, FatigueReason, Lapse, SessionRecord } from "@/types/coach";

export const DEFAULT_WINDOW_MIN = 45;
export const MIN_WINDOW_MIN = 15;
export const MAX_WINDOW_MIN = 90;
export const MIN_PERSONAL_SAMPLES = 3;
export const BREAK_RISK_THRESHOLD = 70;
const LAPSE_LOOKBACK_MS = 10 * 60_000;

const LAPSE_POINTS: Record<DetectionType | "tab", number> = {
  tab: 6,
  drowsiness: 15,
  distraction: 8,
  phone: 6,
  posture: 4,
  away: 0,
};

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface FocusWindow {
  minutes: number;
  personal: boolean;
  samples: number;
}

export function personalFocusWindow(history: SessionRecord[], excludeId?: number | null): FocusWindow {
  const samples = history
    .filter((r) => r.id !== excludeId)
    .flatMap((r) => r.firstLapseMinutes)
    .filter((m) => Number.isFinite(m) && m > 0.5);
  if (samples.length < MIN_PERSONAL_SAMPLES) {
    return { minutes: DEFAULT_WINDOW_MIN, personal: false, samples: samples.length };
  }
  const m = Math.round(Math.min(MAX_WINDOW_MIN, Math.max(MIN_WINDOW_MIN, median(samples))));
  return { minutes: m, personal: true, samples: samples.length };
}

export interface HourInsight {
  hour: number;
  sessions: number;
  focusRatio: number;
}

/** Focus ratio per start-hour, only for hours with ≥2 sessions. */
export function hourInsights(history: SessionRecord[], excludeId?: number | null): HourInsight[] {
  const byHour = new Map<number, { study: number; focused: number; n: number }>();
  for (const r of history) {
    if (r.id === excludeId || r.studyMs < 60_000) continue;
    const b = byHour.get(r.hour) ?? { study: 0, focused: 0, n: 0 };
    b.study += r.studyMs;
    b.focused += r.focusedMs;
    b.n += 1;
    byHour.set(r.hour, b);
  }
  return [...byHour.entries()]
    .filter(([, b]) => b.n >= 2 && b.study > 0)
    .map(([hour, b]) => ({ hour, sessions: b.n, focusRatio: b.focused / b.study }))
    .sort((a, b) => b.focusRatio - a.focusRatio);
}

export function overallFocusRatio(history: SessionRecord[], excludeId?: number | null): number | null {
  let study = 0, focused = 0;
  for (const r of history) {
    if (r.id === excludeId) continue;
    study += r.studyMs;
    focused += r.focusedMs;
  }
  return study > 60_000 ? focused / study : null;
}

export function formatHour(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${suffix}`;
}

export interface FatigueInput {
  now: number;
  blockStartedAt: number;
  lapses: Lapse[];
  eyesClosing: boolean;
  focusScore: number;
  history: SessionRecord[];
  currentSessionId: number | null;
}

export function estimateFatigue(input: FatigueInput): FatigueEstimate {
  const { now, blockStartedAt, lapses, eyesClosing, focusScore, history, currentSessionId } = input;
  const reasons: FatigueReason[] = [];
  const window = personalFocusWindow(history, currentSessionId);
  const blockMinutes = Math.max(0, (now - blockStartedAt) / 60_000);

  // 1. Time on task relative to the personal window.
  const timeRatio = Math.min(1.25, blockMinutes / window.minutes);
  const timePts = Math.round(timeRatio * 48);
  if (timePts > 0) {
    reasons.push({
      label: `${Math.round(blockMinutes)} min on task · ${window.personal ? "your" : "default"} window is ${window.minutes} min`,
      points: timePts,
    });
  }

  // 2. Recent lapses since the block started (last 10 min).
  const recent = lapses.filter((l) => l.at >= Math.max(blockStartedAt, now - LAPSE_LOOKBACK_MS));
  let lapsePts = 0;
  const counts = new Map<DetectionType | "tab", number>();
  for (const l of recent) {
    lapsePts += LAPSE_POINTS[l.type];
    counts.set(l.type, (counts.get(l.type) ?? 0) + 1);
  }
  lapsePts = Math.min(35, lapsePts);
  if (lapsePts > 0) {
    const parts = [...counts.entries()]
      .filter(([t]) => LAPSE_POINTS[t] > 0)
      .map(([t, n]) => `${n} ${t}`);
    reasons.push({ label: `Recent lapses (10 min): ${parts.join(", ")}`, points: lapsePts });
  }

  // 3. Eyes closing right now.
  if (eyesClosing) reasons.push({ label: "Eyes closing right now", points: 10 });

  // 4. Low focus score.
  if (focusScore < 60) {
    reasons.push({ label: `Focus score is ${focusScore}`, points: Math.min(10, Math.round((60 - focusScore) / 3)) });
  }

  // 5. Historically weak hour.
  const hours = hourInsights(history, currentSessionId);
  const avg = overallFocusRatio(history, currentSessionId);
  const thisHour = new Date(now).getHours();
  const weak = hours.find((h) => h.hour === thisHour);
  if (weak && avg != null && weak.focusRatio < avg - 0.1) {
    reasons.push({ label: `${formatHour(thisHour)} is usually a weaker hour for you`, points: 8 });
  }

  const risk = Math.max(0, Math.min(100, reasons.reduce((a, r) => a + r.points, 0)));
  const level = risk >= BREAK_RISK_THRESHOLD ? "BREAK_RECOMMENDED" : risk >= 40 ? "BUILDING" : "FRESH";
  const minutesToBreak = level === "BREAK_RECOMMENDED" ? 0 : Math.max(1, Math.round(window.minutes - blockMinutes - lapsePts / 4));

  return {
    risk,
    level,
    reasons: reasons.sort((a, b) => b.points - a.points),
    blockMinutes,
    windowMinutes: window.minutes,
    windowPersonal: window.personal,
    windowSamples: window.samples,
    minutesToBreak,
  };
}
