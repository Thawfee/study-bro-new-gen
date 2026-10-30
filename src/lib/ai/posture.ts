/* Posture detection module.
   Future: MediaPipe Pose (shoulder/neck/head landmarks) emits PostureResult. */

import type { PostureReason, PostureResult, PostureStatus, Severity } from "@/types/ai";

export function normalPosture(): PostureResult {
  return { status: "GOOD", reason: null, confidence: 0.9, lastDetected: null };
}

const REASONS: PostureReason[] = [
  "Slouching",
  "Head too low",
  "Leaning",
  "Too close to screen",
];

export function triggeredPosture(now: number, status: PostureStatus = "BAD"): PostureResult {
  return {
    status,
    reason: REASONS[Math.floor(Math.random() * REASONS.length)],
    confidence: 0.86,
    lastDetected: now,
  };
}

export function postureSeverity(status: PostureStatus): Severity {
  if (status === "BAD") return "critical";
  if (status === "WARNING") return "warning";
  return "normal";
}
