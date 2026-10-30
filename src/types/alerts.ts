/* ============================================================
   StudyBro AI — Interventions, nudges & alert settings
   (No video: interventions are sound + on-screen, condition-aware.)
   ============================================================ */

import type { DetectionType, Severity } from "./ai";
import type { QuizQuestion } from "./coach";

/** An entry in the session timeline. */
export interface AlertEvent {
  id: string;
  type: DetectionType | "system" | "tab";
  icon: string; // emoji
  message: string;
  severity: Severity;
  timestamp: number;
}

/**
 * A blocking intervention:
 *  - "quiz"  Recall Check (drowsiness: wake phase first, then the question)
 *  - "wake"  wake-up alarm until the eyes reopen (when Recall Check is off)
 *  - "phone" phone-down alarm until the phone leaves the frame
 */
export type InterventionKind = "quiz" | "wake" | "phone";

export interface Intervention {
  id: string;
  type: DetectionType;
  kind: InterventionKind;
  title: string;
  message: string;
  createdAt: number;
  quiz?: QuizQuestion;
  /** Live mode: when the triggering condition cleared. */
  conditionClearedAt: number | null;
  quizAnswered: boolean;
}

/** Lightweight, non-blocking nudge (top of screen). */
export interface ToastMessage {
  id: string;
  type: DetectionType | "system" | "tab";
  icon: string;
  title: string;
  message: string;
  severity: Severity;
  createdAt: number;
  /** Play the soft nudge chime when shown. */
  sound: boolean;
}

/** User-tunable behaviour (persisted; edited in /settings). */
export interface AlertSettings {
  /* sessions */
  defaultDurationMin: number; // 0 = no limit
  cameraByDefault: boolean;
  autoPauseAway: boolean;
  tabTracking: boolean;
  desktopNotifications: boolean;

  /* interventions & sound */
  interventionsEnabled: boolean;
  soundEnabled: boolean;
  /** 0–100 */
  volume: number;
  /** Minimum gap between two blocking interventions of the same type (ms). */
  cooldownMs: number;

  /* camera AI */
  showLandmarks: boolean;
  drowsinessThresholdMs: number;
  distractionThresholdMs: number;
  phoneThresholdMs: number;
  awayThresholdMs: number;
  postureThresholdMs: number;

  /* AI coach */
  quizInterventions: boolean;
  confusionHelp: boolean;
  smartBreaks: boolean;
  breakMinutes: number;
}
