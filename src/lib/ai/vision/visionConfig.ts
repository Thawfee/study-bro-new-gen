/* ============================================================
   Real in-browser computer-vision configuration.

   Expo accuracy profile:
   - calibration before any alert can fire
   - person-adaptive eye-closure thresholds
   - conservative side-look / posture boundaries
   - stronger object-confidence filtering
   - temporal smoothing so one noisy frame never changes the state
   ============================================================ */

/** MediaPipe FaceLandmarker WASM + model (loaded at runtime from CDN). */
export const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
export const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** Initial fallback EAR threshold. The live engine replaces this with a
 * per-person threshold after calibration. */
export const EAR_CLOSED_THRESHOLD = 0.185;
/** Adaptive threshold = calibrated open EAR × this ratio. */
export const EAR_CLOSED_RATIO = 0.64;
export const EAR_THRESHOLD_MIN = 0.145;
export const EAR_THRESHOLD_MAX = 0.205;
/** Smooth recent eye measurements before deciding open/closed. */
export const EAR_SMOOTH_WINDOW = 9;

/** Give the camera/model time to learn neutral face, eye and head-pose values.
 * No behavioral alert is allowed during this window. */
export const VISION_CALIBRATION_MS = 3200;
export const VISION_MIN_CALIBRATION_SAMPLES = 24;

/** Drowsiness timing. */
export const DROWSY_WARNING_MS = 3500;
export const DROWSY_CRITICAL_MS = 5200;
/** Short open-eye gaps can be landmark noise; sustained opening resets. */
export const EYE_OPEN_DEBOUNCE_MS = 450;
/** Do not classify drowsiness from a strongly rotated face, where eye EAR is
 * less reliable. Relative head pose is measured from the calibrated neutral. */
export const DROWSY_MAX_YAW_DEG = 24;
export const DROWSY_MAX_PITCH_DEG = 28;

/** Presence. */
export const AWAY_MS = 6000;
export const FACE_LOSS_DEBOUNCE_MS = 850;
/** Keep the last reliable face landmarks briefly to avoid UI flicker on one
 * missed MediaPipe frame. This does NOT keep the person "present" forever. */
export const FACE_TRACK_HOLD_MS = 320;

/** Relative head-pose thresholds for distraction. Side looking is the most
 * reliable signal. Looking down is intentionally conservative because students
 * naturally glance at books/keyboards. */
export const GAZE_YAW_DISTRACT_DEG = 27;
export const GAZE_UP_DISTRACT_DEG = 28;
export const GAZE_DOWN_DISTRACT_DEG = 40;
export const DISTRACTION_MS = 3200;
export const GAZE_CENTER_DEBOUNCE_MS = 650;

/** Legacy geometry thresholds retained for fallback-only calculations. */
export const GAZE_OFFSET_THRESHOLD = 0.12;
export const GAZE_VERT_THRESHOLD = 0.16;

/** Posture should be independent from head turning. A side look is a gaze
 * event, not "bad posture". The live engine evaluates posture relative to the
 * user's calibrated neutral position. */
export const POSTURE_CONFIRM_MS = 4500;
export const POSTURE_GOOD_DEBOUNCE_MS = 1000;
export const POSTURE_CENTER_X_WARN_DELTA = 0.19;
export const POSTURE_CENTER_X_BAD_DELTA = 0.26;
export const POSTURE_CENTER_Y_WARN_DELTA = 0.105;
export const POSTURE_CENTER_Y_BAD_DELTA = 0.16;
export const POSTURE_TOO_CLOSE_RATIO_WARN = 1.32;
export const POSTURE_TOO_CLOSE_RATIO_BAD = 1.48;
export const POSTURE_MAX_YAW_FOR_EVAL = 20;

/** Object detection. COCO-SSD's canonical class is "cell phone". Including
 * "remote" created false positives, so it is intentionally excluded. */
export const PHONE_MIN_CONFIDENCE = 0.58;
export const PHONE_CLASSES = ["cell phone", "mobile phone", "phone"];
export const PHONE_CONFIRM_MS = 1900;
export const PHONE_LOSS_DEBOUNCE_MS = 450;
export const OBJECT_DETECT_INTERVAL_MS = 240;
/** Require repeated positive object detections before the temporal phone timer
 * is considered live. */
export const PHONE_EVIDENCE_RISE = 0.34;
export const PHONE_EVIDENCE_FALL = 0.28;
export const PHONE_EVIDENCE_ON = 0.66;
export const PHONE_EVIDENCE_OFF = 0.28;

/** Push summarized live values into the store this often. */
export const STORE_SYNC_INTERVAL_MS = 280;

/** MediaPipe FaceMesh eye landmark indices. */
export const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
export const LEFT_EYE = [362, 385, 387, 263, 373, 380];

export const RIGHT_EYE_RING = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
export const LEFT_EYE_RING = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];

export const NOSE_TIP = 1;
export const LEFT_EYE_OUTER = 33;
export const RIGHT_EYE_OUTER = 263;

/* ----------------------- AI Coach: confusion cue ----------------------- */
/** Brow-furrow cue = weighted MediaPipe blendshapes, measured relative to the
 * student's own calibrated neutral face. Experimental — a cue, not a diagnosis. */
export const CONFUSION_EMA_ALPHA = 0.12;
/** Delta above neutral that counts as "thinking hard". */
export const CONFUSION_THINKING_DELTA = 0.1;
/** Delta above neutral that counts as "puzzled". */
export const CONFUSION_PUZZLED_DELTA = 0.17;
/** Puzzled must hold this long (while looking at the screen) before help is offered. */
export const CONFUSION_CONFIRM_MS = 7000;
/** Short relaxations shorter than this don't reset the timer. */
export const CONFUSION_CLEAR_DEBOUNCE_MS = 1500;
