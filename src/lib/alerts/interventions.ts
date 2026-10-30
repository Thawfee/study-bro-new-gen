/* ============================================================
   Intervention + nudge copy and default settings.

   Escalation ladder (no videos):
     posture            → soft nudge
     distraction (1st)  → soft nudge
     distraction (2nd within 3 min) → Recall Check
     drowsiness         → wake alarm, then Recall Check
     phone              → phone-down alarm until it's gone
     away               → session auto-pauses (no alarm)
     left the tab       → nudge on return (+ desktop notification)
   ============================================================ */

import type { DetectionType } from "@/types/ai";
import type { AlertSettings } from "@/types/alerts";

export const DEFAULT_SETTINGS: AlertSettings = {
  defaultDurationMin: 25,
  cameraByDefault: true,
  autoPauseAway: true,
  tabTracking: true,
  desktopNotifications: false,

  interventionsEnabled: true,
  soundEnabled: true,
  volume: 70,
  cooldownMs: 30_000,

  showLandmarks: true,
  drowsinessThresholdMs: 5200,
  distractionThresholdMs: 3200,
  phoneThresholdMs: 1900,
  awayThresholdMs: 6000,
  postureThresholdMs: 4500,

  quizInterventions: true,
  confusionHelp: true,
  smartBreaks: true,
  breakMinutes: 5,
};

/** A second distraction inside this window escalates to a Recall Check. */
export const DISTRACTION_ESCALATE_MS = 3 * 60_000;
/** Leaving the tab for longer than this counts as a digital distraction. */
export const TAB_LAPSE_MS = 8_000;

export const INTERVENTION_COPY = {
  wakeQuiz: {
    title: "Wake up — Recall Check",
    message: "Your eyes closed for a while. Open them and answer one question from your notes.",
  },
  focusQuiz: {
    title: "Quick Recall Check",
    message: "Second look-away in a few minutes. One question from your notes brings you back.",
  },
  wake: {
    title: "Wake up, Bro",
    message: "Your eyes have been closed for a while. Sit up, open your eyes and take a deep breath.",
  },
  phone: {
    title: "Phone down",
    message: "Your phone is in view. Put it face-down or out of reach — this alert stops by itself.",
  },
} as const;

export const NUDGE_COPY: Record<Exclude<DetectionType, "drowsiness" | "phone">, { icon: string; title: string; message: string }> = {
  distraction: { icon: "👀", title: "Eyes back on your work", message: "You've been looking away for a few seconds." },
  posture: { icon: "🪑", title: "Check your posture", message: "Sit back and lift your head a little." },
  away: { icon: "⏸️", title: "Session paused", message: "You stepped away — it resumes when you're back." },
};
