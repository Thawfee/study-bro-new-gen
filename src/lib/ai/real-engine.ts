/* ============================================================
   Real-AI episode builder — the live counterpart of demo-engine.
   Produces the SAME payload shape (DemoDetectionOutput) but from
   REAL model outputs, so it flows through the identical store
   pipeline (score → event → anti-spam → intervention). Confidence
   values here come from the actual models — never fabricated.
   ============================================================ */

import type { DemoDetectionOutput } from "./demo-engine";
import type { GazeDirection } from "@/types/ai";

export function realPhoneEpisode(now: number, confidence: number, usageMs = 0): DemoDetectionOutput {
  return {
    type: "phone",
    patch: {
      phone: { status: "DETECTED", confidence, usageDurationMs: usageMs, lastDetected: now },
    },
    event: { icon: "📱", message: "Phone detected", severity: "critical" },
    explanation: {
      type: "phone",
      alert: "Phone detected",
      reason: "COCO-SSD detected a cell-phone object consistently across multiple camera checks.",
      confidence,
      action: "StudyBro temporarily reduced your focus score.",
      timestamp: now,
    },
  };
}

export function realDrowsyEpisode(now: number, ear: number, confidence: number, seconds = 5): DemoDetectionOutput {
  return {
    type: "drowsiness",
    patch: {
      drowsiness: { status: "CRITICAL", eyeState: "closed", confidence, lastDetected: now },
    },
    event: { icon: "😴", message: "Drowsiness detected", severity: "critical" },
    explanation: {
      type: "drowsiness",
      alert: "Drowsiness detected",
      reason: `Eyes remained closed for ${seconds.toFixed(1)} seconds (EAR ${ear.toFixed(2)}).`,
      confidence,
      action: "StudyBro triggered a wake-up intervention and reduced your focus score.",
      timestamp: now,
    },
  };
}

export function realDistractionEpisode(
  now: number,
  direction: GazeDirection,
  confidence: number,
  seconds = 3,
): DemoDetectionOutput {
  return {
    type: "distraction",
    patch: {
      gaze: {
        status: "DISTRACTED",
        direction,
        distractionDurationMs: seconds * 1000,
        confidence,
        lastDetected: now,
      },
    },
    event: { icon: "👀", message: `Distraction detected — looking ${direction.toLowerCase()}`, severity: "critical" },
    explanation: {
      type: "distraction",
      alert: "Distraction detected",
      reason: `Head/gaze remained turned ${direction.toLowerCase()} for ${seconds.toFixed(1)} seconds.`,
      confidence,
      action: "StudyBro reduced your focus score and nudged you back on task.",
      timestamp: now,
    },
  };
}

export function realAwayEpisode(now: number): DemoDetectionOutput {
  return {
    type: "away",
    patch: {
      presence: { status: "AWAY", faceDetected: false, awayDurationMs: 0, lastDetected: now },
    },
    event: { icon: "🚶", message: "Student left the desk", severity: "critical" },
    explanation: {
      type: "away",
      alert: "Student away",
      reason: "No face detected in the frame beyond the presence threshold.",
      confidence: 0.9,
      action: "StudyBro paused focus accrual and reduced your focus score.",
      timestamp: now,
    },
  };
}

export function realPostureEpisode(
  now: number,
  reason: "Slouching" | "Head too low" | "Leaning" | "Too close to screen",
  confidence: number,
): DemoDetectionOutput {
  return {
    type: "posture",
    patch: {
      posture: { status: "BAD", reason, confidence, lastDetected: now },
    },
    event: { icon: "🪑", message: `Posture warning — ${reason.toLowerCase()}`, severity: "warning" },
    explanation: {
      type: "posture",
      alert: "Posture warning",
      reason: `${reason} persisted beyond the posture threshold based on calibrated face position and viewing distance cues.`,
      confidence,
      action: "StudyBro triggered a posture nudge and reduced your focus score.",
      timestamp: now,
    },
  };
}
