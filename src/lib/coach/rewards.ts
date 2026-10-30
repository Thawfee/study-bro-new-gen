/* ============================================================
   Streaks, XP, levels and badges. Pure functions only.
   ============================================================ */

import type { CoachProgress } from "@/types/coach";

/** Deep-focus streak milestones (minutes of uninterrupted focus → XP). */
export const STREAK_MILESTONES: { minutes: number; xp: number; title: string }[] = [
  { minutes: 5, xp: 10, title: "5-min focus streak" },
  { minutes: 15, xp: 25, title: "15-min focus streak" },
  { minutes: 25, xp: 40, title: "25-min deep focus" },
  { minutes: 45, xp: 60, title: "45-min deep focus" },
  { minutes: 60, xp: 80, title: "60-min flow state" },
];

export const XP = {
  quizCorrect: 15,
  quizTried: 5,
  smartBreak: 10,
  doubt: 5,
  fastRecovery: 10,
  badge: 20,
  sessionComplete: 25,
  plannedBonus: 15,
  cardReview: 2,
} as const;

/** A recovery faster than this counts as a "bounce back". */
export const FAST_RECOVERY_MS = 8000;

const LEVEL_NAMES = ["Rookie", "Grinder", "Locked-In", "Scholar", "Sensei", "Mastermind", "Legend"];

export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
  const floor = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return {
    level,
    name: LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, level - 1)],
    floor,
    next,
    progress: (xp - floor) / (next - floor),
  };
}

export function emptyProgress(): CoachProgress {
  return {
    xp: 0,
    badges: [],
    quizzesAnswered: 0,
    quizzesCorrect: 0,
    bestStreakMs: 0,
    breaksTaken: 0,
    doubtsLogged: 0,
    fastRecoveries: 0,
    studyDays: [],
    sessionsCompleted: 0,
    cardsReviewed: 0,
  };
}

export function localDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Consecutive study days ending today (or yesterday, if today isn't logged yet). */
export function dayStreak(studyDays: string[], now: number = Date.now()): number {
  const set = new Set(studyDays);
  let cursor = now;
  if (!set.has(localDate(cursor))) cursor -= 864e5;
  let n = 0;
  while (set.has(localDate(cursor))) {
    n += 1;
    cursor -= 864e5;
  }
  return n;
}

export interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  progress: (p: CoachProgress) => number; // 0..1
}

const frac = (v: number, target: number) => Math.max(0, Math.min(1, v / target));

export const BADGES: BadgeDef[] = [
  { id: "deep-diver", icon: "🤿", title: "Deep Diver", description: "Hold a 25-minute deep-focus streak.", progress: (p) => frac(p.bestStreakMs, 25 * 60_000) },
  { id: "flow-state", icon: "🌊", title: "Flow State", description: "Hold a 60-minute deep-focus streak.", progress: (p) => frac(p.bestStreakMs, 60 * 60_000) },
  { id: "first-recall", icon: "🧠", title: "First Recall", description: "Answer a Recall Check correctly.", progress: (p) => frac(p.quizzesCorrect, 1) },
  { id: "recall-master", icon: "🎓", title: "Recall Master", description: "Answer 10 Recall Checks correctly.", progress: (p) => frac(p.quizzesCorrect, 10) },
  { id: "sharp-mind", icon: "🎯", title: "Sharp Mind", description: "80%+ Recall accuracy over at least 5 checks.", progress: (p) => (p.quizzesAnswered >= 5 ? (p.quizzesCorrect / p.quizzesAnswered >= 0.8 ? 1 : p.quizzesCorrect / p.quizzesAnswered) : frac(p.quizzesAnswered, 5) * 0.8) },
  { id: "bounce-back", icon: "⚡", title: "Bounce Back", description: `Recover from an intervention in under ${FAST_RECOVERY_MS / 1000}s.`, progress: (p) => frac(p.fastRecoveries, 1) },
  { id: "smart-rester", icon: "🧘", title: "Smart Rester", description: "Take 3 coach-recommended breaks.", progress: (p) => frac(p.breaksTaken, 3) },
  { id: "curious-mind", icon: "❓", title: "Curious Mind", description: "Save 3 doubts when the confusion cue asks.", progress: (p) => frac(p.doubtsLogged, 3) },
  { id: "finisher", icon: "🏁", title: "Finisher", description: "Complete 5 planned focus sessions.", progress: (p) => frac(p.sessionsCompleted, 5) },
  { id: "card-shark", icon: "🃏", title: "Card Shark", description: "Review 50 flashcards.", progress: (p) => frac(p.cardsReviewed, 50) },
  { id: "on-fire", icon: "🔥", title: "On Fire", description: "Study 3 days in a row (5+ focused minutes a day).", progress: (p) => frac(dayStreak(p.studyDays), 3) },
  { id: "week-warrior", icon: "🗓️", title: "Week Warrior", description: "Study 7 days in a row.", progress: (p) => frac(dayStreak(p.studyDays), 7) },
];

/** Badges whose condition is met but are not yet in `progress.badges`. */
export function newlyEarned(p: CoachProgress): BadgeDef[] {
  return BADGES.filter((b) => !p.badges.includes(b.id) && b.progress(p) >= 1);
}
