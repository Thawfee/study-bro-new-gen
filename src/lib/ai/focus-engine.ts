/* ============================================================
   Focus Engine — the single source of truth for the Focus Score.
   Pure functions only (no React, no side effects) so it is trivial
   to unit-test and to reuse when the real AI backend arrives.
   ============================================================ */

import type { DetectionType, FocusStatus } from "@/types/ai";

/** Score deductions per detection event. */
export const DEDUCTIONS: Record<DetectionType, number> = {
  phone: -10,
  drowsiness: -15,
  distraction: -5, // "long distraction"
  posture: -5,
  away: 0, // the session pauses instead — no penalty for stepping away
};

/** Human-readable factor labels for the Focus Score Factors panel. */
export const FACTOR_LABELS: Record<DetectionType, string> = {
  phone: "Phone usage",
  drowsiness: "Drowsiness",
  distraction: "Distraction",
  posture: "Bad posture",
  away: "Away from desk",
};

/** Focused-time rewards (minutes → points), applied once per milestone. */
export const REWARD_MILESTONES: { minutes: number; points: number; label: string }[] = [
  { minutes: 10, points: 2, label: "10 min focused" },
  { minutes: 30, points: 5, label: "30 min focused" },
  { minutes: 60, points: 10, label: "60 min focused" },
];

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

export function clampScore(score: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

export function deductionFor(type: DetectionType): number {
  return DEDUCTIONS[type];
}

/** Derive an overall status label from the numeric score. */
export function focusStatusFromScore(score: number): FocusStatus {
  if (score >= 75) return "Focused";
  if (score >= 45) return "Distracted";
  return "At Risk";
}

/** Tailwind-ish token name for score coloring. */
export function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 75) return "good";
  if (score >= 45) return "warn";
  return "bad";
}
