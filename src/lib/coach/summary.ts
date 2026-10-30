/* ============================================================
   Session report — grade + personalised, rule-based tips.
   Every tip is traceable to a number from this session.
   ============================================================ */

import type { Lapse, SessionRecord } from "@/types/coach";
import type { LapseCounts, SessionPlan, SessionSummary, StudyMetrics, RecoveryRecord } from "@/types/session";
import { formatHour, hourInsights, personalFocusWindow } from "./fatigue";

export function gradeFor(focusPct: number, studyMs: number): string {
  if (studyMs < 60_000) return "—";
  if (focusPct >= 90) return "A+";
  if (focusPct >= 80) return "A";
  if (focusPct >= 70) return "B";
  if (focusPct >= 55) return "C";
  return "D";
}

export function countLapses(lapses: Lapse[]): LapseCounts {
  const c: LapseCounts = { drowsiness: 0, phone: 0, distraction: 0, posture: 0, away: 0, tab: 0 };
  for (const l of lapses) c[l.type] += 1;
  return c;
}

export interface SummaryInput {
  plan: SessionPlan;
  startedAt: number;
  endedAt: number;
  metrics: StudyMetrics;
  score: number;
  lapses: Lapse[];
  quiz: { correct: number; total: number };
  bestStreakMs: number;
  breaks: number;
  recoveries: RecoveryRecord[];
  xpEarned: number;
  history: SessionRecord[];
}

export function buildSummary(i: SummaryInput): SessionSummary {
  const { metrics: m } = i;
  const focusPct = m.studyTimeMs > 0 ? Math.round((m.focusedTimeMs / m.studyTimeMs) * 100) : 0;
  const lapses = countLapses(i.lapses);
  const completed = i.plan.durationMin != null && m.studyTimeMs >= i.plan.durationMin * 60_000 - 1000;
  const recs = i.recoveries.filter((r) => r.recoveredAt >= i.startedAt);
  const avgRecoveryMs = recs.length ? recs.reduce((a, r) => a + r.durationMs, 0) / recs.length : null;

  const tips: { icon: string; text: string }[] = [];
  if (lapses.phone >= 2) tips.push({ icon: "📱", text: `Your phone pulled you away ${lapses.phone} times. Next session, keep it in another room or face-down out of reach.` });
  else if (lapses.phone === 1) tips.push({ icon: "📱", text: "One phone check this session. Try putting it out of sight before you start." });
  if (lapses.drowsiness >= 1) {
    const best = hourInsights(i.history, i.startedAt)[0];
    tips.push({
      icon: "😴",
      text: `You got drowsy ${lapses.drowsiness} time${lapses.drowsiness > 1 ? "s" : ""}. Take a 5-minute break with water${best ? `, or study around ${formatHour(best.hour)} — your strongest hour` : ""}.`,
    });
  }
  if (lapses.tab >= 2) tips.push({ icon: "🗂️", text: `You switched away from the study tab ${lapses.tab} times (${Math.round(m.tabAwayMs / 60_000)} min). Close other tabs or use full-screen.` });
  if (lapses.distraction >= 3) tips.push({ icon: "👀", text: `${lapses.distraction} look-aways. Clear your desk and keep only this task's material in view.` });
  if (lapses.posture >= 2) tips.push({ icon: "🪑", text: "Posture slipped a few times. Raise your screen to eye level and sit back in your chair." });
  if (i.quiz.total >= 2 && i.quiz.correct / i.quiz.total < 0.6) tips.push({ icon: "🃏", text: `Recall accuracy was ${Math.round((i.quiz.correct / i.quiz.total) * 100)}%. Spend 5 minutes in Review before your next session.` });
  const win = personalFocusWindow(i.history, i.startedAt);
  if (win.personal) tips.push({ icon: "⏱️", text: `You usually lose focus after ~${win.minutes} min. Plan a break around then.` });
  if (focusPct >= 85 && m.studyTimeMs >= 10 * 60_000) tips.push({ icon: "🚀", text: "Excellent focus. Try a longer 50-minute block next time." });
  if (!tips.length) tips.push({ icon: "✅", text: m.studyTimeMs < 5 * 60_000 ? "Short session — aim for at least 25 focused minutes to see real patterns." : "Steady session. Keep the same setup next time." });

  return {
    id: i.startedAt,
    startedAt: i.startedAt,
    endedAt: i.endedAt,
    task: i.plan.task,
    subject: i.plan.subject,
    plannedMin: i.plan.durationMin,
    completed,
    studyMs: m.studyTimeMs,
    focusedMs: m.focusedTimeMs,
    focusPct,
    score: i.score,
    grade: gradeFor(focusPct, m.studyTimeMs),
    lapses,
    quiz: i.quiz,
    bestStreakMs: i.bestStreakMs,
    breaks: i.breaks,
    avgRecoveryMs,
    xpEarned: i.xpEarned,
    tips: tips.slice(0, 4),
    camera: i.plan.camera,
    demo: i.plan.demo,
  };
}
