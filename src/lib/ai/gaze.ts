/* Gaze / distraction detection module.
   Future: MediaPipe iris + head-pose estimation emits GazeResult. */

import type { GazeDirection, GazeResult, GazeStatus, Severity } from "@/types/ai";

export function normalGaze(): GazeResult {
  return {
    status: "FOCUSED",
    direction: "CENTER",
    distractionDurationMs: 0,
    confidence: 0.9,
    lastDetected: null,
  };
}

const OFF_CENTER: GazeDirection[] = ["LEFT", "RIGHT", "UP", "DOWN"];

export function triggeredGaze(now: number): GazeResult {
  const direction = OFF_CENTER[Math.floor(Math.random() * OFF_CENTER.length)];
  return {
    status: "DISTRACTED",
    direction,
    distractionDurationMs: 6200,
    confidence: 0.88,
    lastDetected: now,
  };
}

export function gazeSeverity(status: GazeStatus): Severity {
  if (status === "DISTRACTED") return "critical";
  if (status === "SLIGHTLY_DISTRACTED") return "warning";
  return "normal";
}

export function gazeStatusLabel(status: GazeStatus): string {
  return {
    FOCUSED: "Focused",
    SLIGHTLY_DISTRACTED: "Slightly Distracted",
    DISTRACTED: "Distracted",
  }[status];
}
