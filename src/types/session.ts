/* ============================================================
   StudyBro AI — Study session types
   ============================================================ */

export interface StudyMetrics {
  studyTimeMs: number;
  focusedTimeMs: number;
  distractionTimeMs: number;
  phoneUsageMs: number;
  drowsinessMs: number;
  awayMs: number;
  /** Rolling 0–100 posture quality score. */
  postureScore: number;
  /** Time spent on other tabs/apps while the session ran. */
  tabAwayMs: number;
  tabSwitches: number;
  /** Time the session was paused (manual, away or break). */
  pausedMs: number;
}

export interface StudySession {
  startedAt: number | null;
  metrics: StudyMetrics;
}

export function emptyMetrics(): StudyMetrics {
  return {
    studyTimeMs: 0,
    focusedTimeMs: 0,
    distractionTimeMs: 0,
    phoneUsageMs: 0,
    drowsinessMs: 0,
    awayMs: 0,
    postureScore: 100,
    tabAwayMs: 0,
    tabSwitches: 0,
    pausedMs: 0,
  };
}

export type SessionPhase = "idle" | "running" | "paused" | "summary";
export type PauseReason = "manual" | "away" | "break";

/** What the student chose before starting. */
export interface SessionPlan {
  task: string;
  taskId: string | null;
  subject: string;
  /** Planned focus minutes; null = open-ended. */
  durationMin: number | null;
  camera: boolean;
  demo: boolean;
}

export type LapseCounts = Record<"drowsiness" | "phone" | "distraction" | "posture" | "away" | "tab", number>;

/** The end-of-session report. */
export interface SessionSummary {
  id: number;
  startedAt: number;
  endedAt: number;
  task: string;
  subject: string;
  plannedMin: number | null;
  completed: boolean;
  studyMs: number;
  focusedMs: number;
  focusPct: number;
  score: number;
  grade: string;
  lapses: LapseCounts;
  quiz: { correct: number; total: number };
  bestStreakMs: number;
  breaks: number;
  avgRecoveryMs: number | null;
  xpEarned: number;
  tips: { icon: string; text: string }[];
  camera: boolean;
  demo: boolean;
}

/** A measured recovery after an intervention ends. */
export interface RecoveryRecord {
  id: string;
  type: "drowsiness" | "phone" | "distraction" | "posture" | "away";
  startedAt: number;
  recoveredAt: number;
  durationMs: number;
}
