/* Drowsiness detection module.
   Today: shapes/normal+triggered factories for the Demo Engine.
   Future: a MediaPipe FaceMesh + EAR (eye-aspect-ratio) model will
   emit the same DrowsinessResult, so nothing downstream changes. */

import type { DrowsinessResult, DrowsinessStatus, Severity } from "@/types/ai";

export function normalDrowsiness(): DrowsinessResult {
  return { status: "NORMAL", eyeState: "open", confidence: 0.03, lastDetected: null };
}

/** What the model emits when drowsiness crosses the alert threshold. */
export function triggeredDrowsiness(now: number): DrowsinessResult {
  return {
    status: "CRITICAL",
    eyeState: "closed",
    confidence: 0.92,
    lastDetected: now,
  };
}

export function drowsinessSeverity(status: DrowsinessStatus): Severity {
  if (status === "CRITICAL") return "critical";
  if (status === "WARNING") return "warning";
  return "normal";
}

export function eyeStateLabel(s: DrowsinessResult["eyeState"]): string {
  return { open: "Open", closing: "Closing", closed: "Closed" }[s];
}
