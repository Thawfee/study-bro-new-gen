/* ============================================================
   StudyBro AI — Core detection types
   These describe the *shape of AI detection results*. Today the
   Demo Engine produces them; later a Python/OpenCV/MediaPipe/YOLO
   backend will produce the exact same structures over WebSocket,
   so the entire frontend keeps working unchanged.
   ============================================================ */

/** The five behaviors StudyBro monitors. */
export type DetectionType =
  | "drowsiness"
  | "phone"
  | "distraction"
  | "posture"
  | "away";

/** Generic severity used for styling + alert-escalation decisions. */
export type Severity = "normal" | "warning" | "critical";

/* ----------------------------- Drowsiness ----------------------------- */
export type DrowsinessStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type EyeState = "open" | "closing" | "closed";

export interface DrowsinessResult {
  status: DrowsinessStatus;
  eyeState: EyeState;
  /** 0–1 model confidence that the person is drowsy. */
  confidence: number;
  lastDetected: number | null;
}

/* ------------------------------- Phone -------------------------------- */
export type PhoneStatus = "NOT_DETECTED" | "DETECTED";

export interface PhoneResult {
  status: PhoneStatus;
  confidence: number;
  usageDurationMs: number;
  lastDetected: number | null;
}

/* --------------------------- Gaze / Distraction ----------------------- */
export type GazeStatus = "FOCUSED" | "SLIGHTLY_DISTRACTED" | "DISTRACTED";
export type GazeDirection = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN";

export interface GazeResult {
  status: GazeStatus;
  direction: GazeDirection;
  distractionDurationMs: number;
  confidence: number;
  lastDetected: number | null;
}

/* ------------------------------ Posture ------------------------------- */
export type PostureStatus = "GOOD" | "WARNING" | "BAD";
export type PostureReason =
  | "Slouching"
  | "Head too low"
  | "Leaning"
  | "Too close to screen";

export interface PostureResult {
  status: PostureStatus;
  reason: PostureReason | null;
  confidence: number;
  lastDetected: number | null;
}

/* ------------------------------ Presence ------------------------------ */
export type PresenceStatus = "PRESENT" | "AWAY";

export interface PresenceResult {
  status: PresenceStatus;
  faceDetected: boolean;
  awayDurationMs: number;
  lastDetected: number | null;
}

/* -------------------- Aggregate detection snapshot -------------------- */
export interface DetectionSnapshot {
  drowsiness: DrowsinessResult;
  phone: PhoneResult;
  gaze: GazeResult;
  posture: PostureResult;
  presence: PresenceResult;
}

/* ----------------------------- Focus state ---------------------------- */
export type FocusStatus = "Focused" | "Distracted" | "At Risk";

/** A single scoring event shown in the "Focus Score Factors" panel. */
export interface FocusFactor {
  id: string;
  type: DetectionType | "reward" | "tab";
  label: string;
  delta: number; // negative = deduction, positive = reward
  timestamp: number;
}

export interface FocusState {
  score: number; // clamped 0–100
  status: FocusStatus;
  factors: FocusFactor[];
}
