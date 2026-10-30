/* ============================================================
   Demo Engine — simulates the AI detection backend.

   This is the ONLY place that fabricates detection results. It is
   intentionally shaped like the future real backend: call
   `simulateDetection(type)` and receive the same kind of payload a
   Python/FastAPI/WebSocket service would push. When the real AI is
   wired up, swap this module for a WebSocket client — the provider,
   focus engine, alert manager, and all UI stay identical.
   ============================================================ */

import type {
  DetectionType,
  DrowsinessResult,
  GazeResult,
  PhoneResult,
  PostureResult,
  PresenceResult,
  Severity,
} from "@/types/ai";
import { triggeredDrowsiness } from "./drowsiness";
import { triggeredPhone } from "./phone";
import { triggeredGaze } from "./gaze";
import { triggeredPosture } from "./posture";
import { triggeredPresence } from "./presence";

/** Explains *why* StudyBro reacted — powers the AI decision panel. */
export interface AIExplanation {
  type: DetectionType;
  alert: string;
  reason: string;
  confidence: number; // 0–1
  action: string;
  timestamp: number;
}

export interface DemoDetectionOutput {
  type: DetectionType;
  /** Patch to apply to the detection snapshot. */
  patch: Partial<{
    drowsiness: DrowsinessResult;
    phone: PhoneResult;
    gaze: GazeResult;
    posture: PostureResult;
    presence: PresenceResult;
  }>;
  event: { icon: string; message: string; severity: Severity };
  explanation: AIExplanation;
}

export function simulateDetection(type: DetectionType, now: number = Date.now()): DemoDetectionOutput {
  switch (type) {
    case "drowsiness": {
      const r = triggeredDrowsiness(now);
      return {
        type,
        patch: { drowsiness: r },
        event: { icon: "😴", message: "Drowsiness detected", severity: "critical" },
        explanation: {
          type,
          alert: "Drowsiness detected",
          reason: "Eyes closed beyond the alertness threshold (low eye-aspect-ratio).",
          confidence: r.confidence,
          action: "StudyBro sounded a wake-up alarm, then asked a Recall Check from your notes.",
          timestamp: now,
        },
      };
    }
    case "phone": {
      const r = triggeredPhone(now);
      return {
        type,
        patch: { phone: r },
        event: { icon: "📱", message: "Phone detected", severity: "critical" },
        explanation: {
          type,
          alert: "Phone detected",
          reason: "Phone-like object detected in the camera frame.",
          confidence: r.confidence,
          action: "StudyBro raised a phone-down alert that clears once the phone is gone.",
          timestamp: now,
        },
      };
    }
    case "distraction": {
      const r = triggeredGaze(now);
      return {
        type,
        patch: { gaze: r },
        event: { icon: "👀", message: "Distraction detected", severity: "critical" },
        explanation: {
          type,
          alert: "Distraction detected",
          reason: `Gaze directed ${r.direction.toLowerCase()} and away from the screen for a sustained period.`,
          confidence: r.confidence,
          action: "StudyBro reduced your focus score and nudged you back on task.",
          timestamp: now,
        },
      };
    }
    case "posture": {
      const r = triggeredPosture(now);
      return {
        type,
        patch: { posture: r },
        event: { icon: "🪑", message: "Poor posture detected", severity: "critical" },
        explanation: {
          type,
          alert: "Poor posture detected",
          reason: `Pose landmarks indicate: ${r.reason ?? "poor posture"}.`,
          confidence: r.confidence,
          action: "StudyBro reduced your focus score and asked you to sit straight.",
          timestamp: now,
        },
      };
    }
    case "away": {
      const r = triggeredPresence(now);
      return {
        type,
        patch: { presence: r },
        event: { icon: "🚶", message: "Student left the desk", severity: "critical" },
        explanation: {
          type,
          alert: "Student away",
          reason: "No face detected in the frame beyond the presence threshold.",
          confidence: 0.9,
          action: "StudyBro paused the session timer until you return.",
          timestamp: now,
        },
      };
    }
  }
}
