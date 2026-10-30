/* One place that turns live signals into a human study state. */

import type { DetectionSnapshot } from "@/types/ai";
import type { Intervention } from "@/types/alerts";
import type { PauseReason, SessionPhase } from "@/types/session";
import type { Tone } from "@/lib/tone";

export interface StudyStateView {
  label: string;
  detail: string;
  tone: Tone;
  emoji: string;
}

export function deriveStudyState(input: {
  phase: SessionPhase;
  pauseReason: PauseReason | null;
  detections: DetectionSnapshot;
  intervention: Intervention | null;
  score: number;
  cameraLive: boolean;
}): StudyStateView {
  const { phase, pauseReason, detections: d, intervention, score, cameraLive } = input;
  if (phase === "idle" || phase === "summary") return { label: "Ready", detail: "No session running", tone: "neutral", emoji: "⚪" };
  if (phase === "paused") {
    if (pauseReason === "break") return { label: "On a break", detail: "Timer paused — recharge", tone: "brand", emoji: "🧘" };
    if (pauseReason === "away") return { label: "Away", detail: "Paused until you're back", tone: "neutral", emoji: "🚶" };
    return { label: "Paused", detail: "Resume when you're ready", tone: "neutral", emoji: "⏸️" };
  }
  if (intervention?.type === "phone" || d.phone.status === "DETECTED") return { label: "Phone in view", detail: "Put it away to continue", tone: "bad", emoji: "📱" };
  if (intervention?.type === "drowsiness" || d.drowsiness.status === "CRITICAL") return { label: "Drowsy", detail: "Wake-up check active", tone: "bad", emoji: "😴" };
  if (d.drowsiness.status === "WARNING") return { label: "Getting tired", detail: "Eyes closing — consider a break", tone: "warn", emoji: "🥱" };
  if (d.gaze.status === "DISTRACTED") return { label: "Distracted", detail: "Looking away from your work", tone: "warn", emoji: "👀" };
  if (d.posture.status === "BAD") return { label: "Slouching", detail: d.posture.reason ?? "Check your posture", tone: "warn", emoji: "🪑" };
  if (!cameraLive) return { label: "Focusing", detail: "Timer + tab tracking", tone: "good", emoji: "🎯" };
  return score >= 90
    ? { label: "Deep focus", detail: "Everything looks locked in", tone: "good", emoji: "🟢" }
    : { label: "Focused", detail: "On task", tone: "good", emoji: "🔵" };
}

/** Elapsed / remaining clock for the running session. */
export function sessionClock(studyMs: number, durationMin: number | null) {
  if (durationMin == null) return { mainMs: studyMs, countdown: false, progress: null as number | null };
  const total = durationMin * 60_000;
  return { mainMs: Math.max(0, total - studyMs), countdown: true, progress: Math.min(1, studyMs / total) };
}

export function clockText(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
