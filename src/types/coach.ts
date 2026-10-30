/* ============================================================
   StudyBro AI Coach — types for the four "coach, not police"
   features: Recall Check quizzes, fatigue prediction + smart
   breaks, the confusion cue, and streaks / XP / badges.
   ============================================================ */

import type { DetectionType } from "./ai";

/* ------------------------------ Quiz --------------------------------- */

export type QuizKind = "qa" | "cloze" | "topic" | "warmup";

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Shown after answering — where the question came from / why. */
  explanation: string;
  sourceTitle: string | null;
}

/* ---------------------------- Confusion ------------------------------ */

export type ConfusionStatus = "CLEAR" | "THINKING" | "PUZZLED";

export interface ConfusionState {
  status: ConfusionStatus;
  /** 0–1 brow-furrow cue above the calibrated neutral face. */
  level: number;
}

export interface HelpPrompt {
  id: string;
  createdAt: number;
  source: "live" | "demo";
}

/* ------------------------- Fatigue / breaks -------------------------- */

export type FatigueLevel = "FRESH" | "BUILDING" | "BREAK_RECOMMENDED";

export interface FatigueReason {
  label: string;
  points: number;
}

export interface FatigueEstimate {
  risk: number; // 0–100
  level: FatigueLevel;
  reasons: FatigueReason[];
  /** Minutes on task since session start / last break. */
  blockMinutes: number;
  /** Personal focus window in minutes (median time-to-first-lapse). */
  windowMinutes: number;
  /** true when the window comes from ≥3 of the student's own samples. */
  windowPersonal: boolean;
  windowSamples: number;
  /** Predicted minutes until a break will be needed (0 = now). */
  minutesToBreak: number;
}

export interface BreakState {
  startedAt: number;
  endsAt: number;
  suggested: boolean;
}

export interface BreakSuggestion {
  id: string;
  createdAt: number;
  risk: number;
  reasons: FatigueReason[];
}

/** One lapse (an intervention-worthy episode) in the current session. */
export interface Lapse {
  at: number;
  type: DetectionType | "tab";
  live: boolean;
}

/* ----------------------------- History ------------------------------- */

/** A saved study session, used for the personal prediction model. */
export interface SessionRecord {
  id: number; // session start timestamp
  date: string; // yyyy-mm-dd (local)
  hour: number; // local start hour 0–23
  studyMs: number;
  focusedMs: number;
  /** Minutes from start/break to the first *live* lapse of each block. */
  firstLapseMinutes: number[];
  lapses: number;
  quizCorrect: number;
  quizTotal: number;
  breaks: number;
  bestStreakMs: number;
  /* added in v2 (optional for older saved records) */
  task?: string;
  subject?: string;
  plannedMin?: number | null;
  score?: number;
  completed?: boolean;
  endedAt?: number;
  tabSwitches?: number;
  avgRecoveryMs?: number | null;
  lapseCounts?: Partial<Record<DetectionType | "tab", number>>;
  demo?: boolean;
}

/* --------------------------- Progress / XP --------------------------- */

export interface CoachProgress {
  xp: number;
  badges: string[];
  quizzesAnswered: number;
  quizzesCorrect: number;
  bestStreakMs: number;
  breaksTaken: number;
  doubtsLogged: number;
  fastRecoveries: number;
  /** Local dates (yyyy-mm-dd) with ≥5 min of focused study. */
  studyDays: string[];
  sessionsCompleted: number;
  cardsReviewed: number;
}

export interface Celebration {
  id: string;
  icon: string;
  title: string;
  detail: string;
  xp: number;
  createdAt: number;
}

export interface StreakState {
  /** Continuous focused time since the last lapse. */
  currentMs: number;
  /** Best streak in this session. */
  sessionBestMs: number;
  /** Minute milestones already celebrated in the current streak. */
  milestonesHit: number[];
}
