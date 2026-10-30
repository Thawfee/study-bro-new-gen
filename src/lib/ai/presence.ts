/* Presence detection module.
   Future: a face detector (MediaPipe/YOLO) reports whether a face is
   in-frame; absence beyond a threshold => AWAY. */

import type { PresenceResult, PresenceStatus, Severity } from "@/types/ai";

export function normalPresence(): PresenceResult {
  return { status: "PRESENT", faceDetected: true, awayDurationMs: 0, lastDetected: null };
}

export function triggeredPresence(now: number, awayMs = 0): PresenceResult {
  return {
    status: "AWAY",
    faceDetected: false,
    awayDurationMs: awayMs,
    lastDetected: now,
  };
}

export function presenceSeverity(status: PresenceStatus): Severity {
  return status === "AWAY" ? "critical" : "normal";
}
