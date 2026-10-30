/* ============================================================
   Alert Manager — central anti-spam gate for blocking interventions.

   All cooldown logic lives HERE (not scattered in components). A
   blocking intervention may fire only when:
     1. Blocking alerts are enabled
     2. No popup is currently open
     3. The per-type cooldown has expired
   Otherwise the caller should fall back to a lightweight toast.
   ============================================================ */

import type { DetectionType } from "@/types/ai";
import type { AlertSettings } from "@/types/alerts";

/** Timestamp (ms) of the last fired alert, keyed by detection type. */
export type CooldownMap = Partial<Record<DetectionType, number>>;

export interface AlertGateInput {
  type: DetectionType;
  now: number;
  settings: AlertSettings;
  /** Is an intervention currently open? */
  alertOpen: boolean;
  /** Per-type last-fired timestamps. */
  cooldowns: CooldownMap;
}

export type AlertDecision =
  | { fire: true }
  | { fire: false; reason: "disabled" | "already-open" | "cooldown"; remainingMs: number };

export function evaluateAlert(input: AlertGateInput): AlertDecision {
  const { type, now, settings, alertOpen, cooldowns } = input;

  if (!settings.interventionsEnabled) {
    return { fire: false, reason: "disabled", remainingMs: 0 };
  }
  if (alertOpen) {
    return { fire: false, reason: "already-open", remainingMs: 0 };
  }

  const last = cooldowns[type];
  if (last != null) {
    const elapsed = now - last;
    if (elapsed < settings.cooldownMs) {
      return { fire: false, reason: "cooldown", remainingMs: settings.cooldownMs - elapsed };
    }
  }
  return { fire: true };
}

export function cooldownRemaining(
  type: DetectionType,
  cooldowns: CooldownMap,
  cooldownMs: number,
  now: number,
): number {
  const last = cooldowns[type];
  if (last == null) return 0;
  return Math.max(0, cooldownMs - (now - last));
}
