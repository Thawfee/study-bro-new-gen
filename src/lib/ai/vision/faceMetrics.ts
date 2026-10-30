/* Pure math over MediaPipe face landmarks: EAR + a simple gaze estimate. */

import type { GazeDirection } from "@/types/ai";
import {
  LEFT_EYE,
  RIGHT_EYE,
  LEFT_EYE_OUTER,
  RIGHT_EYE_OUTER,
  NOSE_TIP,
  GAZE_OFFSET_THRESHOLD,
  GAZE_VERT_THRESHOLD,
} from "./visionConfig";

/** A normalized landmark from FaceLandmarker (x,y,z in 0..1). */
export interface NormLandmark {
  x: number;
  y: number;
  z: number;
}

/** Landmark scaled to pixel space. */
interface Pt {
  x: number;
  y: number;
}

function px(l: NormLandmark, w: number, h: number): Pt {
  return { x: l.x * w, y: l.y * h };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Eye Aspect Ratio for one eye (6 ordered indices). Pixel space matters. */
function eyeEAR(lm: NormLandmark[], idx: number[], w: number, h: number): number {
  const p = idx.map((i) => px(lm[i], w, h));
  const vertical = dist(p[1], p[5]) + dist(p[2], p[4]);
  const horizontal = 2 * dist(p[0], p[3]);
  return horizontal === 0 ? 0 : vertical / horizontal;
}

/** Average EAR across both eyes. Higher = more open (~0.3), lower = closed. */
export function computeEAR(lm: NormLandmark[], w: number, h: number): number {
  const l = eyeEAR(lm, LEFT_EYE, w, h);
  const r = eyeEAR(lm, RIGHT_EYE, w, h);
  return (l + r) / 2;
}

/** Per-eye EAR (left, right) + average. */
export function eyeAspectRatios(lm: NormLandmark[], w: number, h: number) {
  const left = eyeEAR(lm, LEFT_EYE, w, h);
  const right = eyeEAR(lm, RIGHT_EYE, w, h);
  return { left, right, avg: (left + right) / 2 };
}

/**
 * Map a real EAR to an "openness" fraction 0..1 for display. Derived
 * directly from the measured EAR — not a fabricated model score.
 */
export function openness(ear: number, closed = 0.15, open = 0.32): number {
  if (open === closed) return 0;
  return Math.max(0, Math.min(1, (ear - closed) / (open - closed)));
}

export interface GazeEstimate {
  direction: GazeDirection;
  away: boolean;
  /** Head yaw / pitch in degrees when a transform matrix is supplied. */
  yaw: number;
  pitch: number;
}

/** Extract head yaw (left/right) & pitch (up/down) in degrees from the
 *  4x4 facial transformation matrix (column-major, 16 floats). */
export function headPose(matrix?: number[] | Float32Array | null): { yaw: number; pitch: number } | null {
  if (!matrix || matrix.length < 16) return null;
  // Rotation part (column-major): r00=m0, r10=m1, r20=m2 ... r22=m10
  const r20 = matrix[2];
  const r21 = matrix[6];
  const r22 = matrix[10];
  const yaw = Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22)) * (180 / Math.PI);
  const pitch = Math.atan2(r21, r22) * (180 / Math.PI);
  return { yaw, pitch };
}

/**
 * Head/gaze direction. Prefers the head-pose matrix (robust to lighting);
 * falls back to nose-vs-eyeline geometry. Combining both makes distraction
 * detection stable — a small eye flick alone won't trigger it.
 */
export function estimateGaze(
  lm: NormLandmark[],
  matrix?: number[] | Float32Array | null,
): GazeEstimate {
  const nose = lm[NOSE_TIP];
  const le = lm[LEFT_EYE_OUTER];
  const re = lm[RIGHT_EYE_OUTER];
  const eyeMidX = (le.x + re.x) / 2;
  const span = Math.abs(re.x - le.x) || 1;
  const offsetX = (nose.x - eyeMidX) / span;
  const eyeMidY = (le.y + re.y) / 2;
  const offsetY = (nose.y - eyeMidY) / span;

  const pose = headPose(matrix);
  // Normalize signals so |sig| > 1 means "clearly turned away".
  // Vertical is deliberately less sensitive: students naturally look DOWN at
  // books/keyboards, so it takes a bigger tilt to count as distraction.
  const yawSig = pose ? pose.yaw / 20 : offsetX / GAZE_OFFSET_THRESHOLD;   // ~20° left/right
  const pitchDeg = pose ? pose.pitch : (offsetY - 0.6) / GAZE_VERT_THRESHOLD * 26;
  const pitchSig = pitchDeg > 0 ? pitchDeg / 32 : pitchDeg / 26; // 32° down, 26° up

  const horiz = Math.abs(yawSig);
  const vert = Math.abs(pitchSig);
  let direction: GazeDirection = "CENTER";
  // Horizontal (looking sideways) is the strongest distraction signal.
  const away = horiz > 1 || vert > 1.15;
  if (away) {
    if (horiz >= vert) {
      direction = yawSig > 0 ? "LEFT" : "RIGHT";
    } else {
      direction = pitchSig > 0 ? "DOWN" : "UP";
    }
  }
  return { direction, away, yaw: pose?.yaw ?? 0, pitch: pose?.pitch ?? 0 };
}
