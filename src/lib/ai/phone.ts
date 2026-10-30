/* Phone detection module.
   Future: a YOLO object detector ("cell phone" class) emits PhoneResult. */

import type { PhoneResult, PhoneStatus, Severity } from "@/types/ai";

export function normalPhone(): PhoneResult {
  return { status: "NOT_DETECTED", confidence: 0.02, usageDurationMs: 0, lastDetected: null };
}

export function triggeredPhone(now: number, usageMs = 0): PhoneResult {
  return {
    status: "DETECTED",
    confidence: 0.94,
    usageDurationMs: usageMs,
    lastDetected: now,
  };
}

export function phoneSeverity(status: PhoneStatus): Severity {
  return status === "DETECTED" ? "critical" : "normal";
}
