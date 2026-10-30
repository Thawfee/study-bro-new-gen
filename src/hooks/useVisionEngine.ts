"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { getFaceConnections, loadFaceLandmarker, loadObjectDetector } from "@/lib/ai/vision/models";
import { installVisionLogFilter } from "@/lib/ai/vision/suppressLogs";
import { estimateGaze, eyeAspectRatios, openness, type NormLandmark } from "@/lib/ai/vision/faceMetrics";
import {
  realAwayEpisode, realDistractionEpisode, realDrowsyEpisode, realPhoneEpisode, realPostureEpisode,
} from "@/lib/ai/real-engine";
import {
  AWAY_MS, DISTRACTION_MS, DROWSY_CRITICAL_MS, DROWSY_MAX_PITCH_DEG, DROWSY_MAX_YAW_DEG,
  DROWSY_WARNING_MS, EAR_CLOSED_RATIO, EAR_CLOSED_THRESHOLD, EAR_SMOOTH_WINDOW,
  EAR_THRESHOLD_MAX, EAR_THRESHOLD_MIN, EYE_OPEN_DEBOUNCE_MS, FACE_LOSS_DEBOUNCE_MS,
  FACE_TRACK_HOLD_MS, GAZE_CENTER_DEBOUNCE_MS, GAZE_DOWN_DISTRACT_DEG,
  GAZE_UP_DISTRACT_DEG, GAZE_YAW_DISTRACT_DEG, LEFT_EYE, OBJECT_DETECT_INTERVAL_MS,
  PHONE_CLASSES, PHONE_CONFIRM_MS, PHONE_EVIDENCE_FALL, PHONE_EVIDENCE_OFF,
  PHONE_EVIDENCE_ON, PHONE_EVIDENCE_RISE, PHONE_LOSS_DEBOUNCE_MS, PHONE_MIN_CONFIDENCE,
  POSTURE_CENTER_X_BAD_DELTA, POSTURE_CENTER_X_WARN_DELTA, POSTURE_CENTER_Y_BAD_DELTA,
  POSTURE_CENTER_Y_WARN_DELTA, POSTURE_CONFIRM_MS, POSTURE_GOOD_DEBOUNCE_MS,
  POSTURE_MAX_YAW_FOR_EVAL, POSTURE_TOO_CLOSE_RATIO_BAD, POSTURE_TOO_CLOSE_RATIO_WARN,
  RIGHT_EYE, STORE_SYNC_INTERVAL_MS, VISION_CALIBRATION_MS, VISION_MIN_CALIBRATION_SAMPLES,
  CONFUSION_CLEAR_DEBOUNCE_MS, CONFUSION_CONFIRM_MS, CONFUSION_EMA_ALPHA, CONFUSION_PUZZLED_DELTA,
  CONFUSION_THINKING_DELTA,
} from "@/lib/ai/vision/visionConfig";
import type { ConfusionStatus } from "@/types/coach";
import { normalDrowsiness } from "@/lib/ai/drowsiness";
import { normalGaze } from "@/lib/ai/gaze";
import { normalPhone } from "@/lib/ai/phone";
import { normalPresence } from "@/lib/ai/presence";
import { normalPosture } from "@/lib/ai/posture";
import type { GazeDirection, PostureReason, PostureStatus } from "@/types/ai";

export type VisionStatus = "idle" | "loading" | "running" | "error";

export interface LiveVision {
  status: VisionStatus;
  error: string | null;
  fps: number;
  face: boolean;
  faceConfidence: number;
  ear: number;
  eyesClosed: boolean;
  leftOpen: number;
  rightOpen: number;
  drowsy: "NORMAL" | "WARNING" | "CRITICAL";
  phone: boolean;
  phoneConfidence: number;
  phoneUsageMs: number;
  gaze: "FOCUSED" | "SLIGHTLY_DISTRACTED" | "DISTRACTED";
  gazeDirection: GazeDirection;
  headYaw: number;
  headPitch: number;
  posture: PostureStatus;
  postureReason: PostureReason | null;
  postureConfidence: number;
  calibrating: boolean;
  calibrationProgress: number;
  eyeThreshold: number;
  trackingQuality: "CALIBRATING" | "LOCKED" | "DEGRADED";
  /** AI Coach brow-furrow cue (relative to calibrated neutral face). */
  confusion: ConfusionStatus;
  confusionLevel: number;
}

interface PhoneBox { x: number; y: number; w: number; h: number; score: number }

const INITIAL: LiveVision = {
  status: "idle", error: null, fps: 0, face: false, faceConfidence: 0, ear: 0,
  eyesClosed: false, leftOpen: 0, rightOpen: 0, drowsy: "NORMAL", phone: false,
  phoneConfidence: 0, phoneUsageMs: 0, gaze: "FOCUSED", gazeDirection: "CENTER",
  headYaw: 0, headPitch: 0, posture: "GOOD", postureReason: null, postureConfidence: 0,
  calibrating: false, calibrationProgress: 0, eyeThreshold: EAR_CLOSED_THRESHOLD, trackingQuality: "CALIBRATING",
  confusion: "CLEAR", confusionLevel: 0,
};

function freshEdgeState() {
  return {
    eyesClosedSince: 0, eyesOpenSince: 0, drowsyFired: false,
    phonePresentSince: 0, phoneLostSince: 0, phoneFired: false,
    faceLostSince: 0, faceSeenSince: 0, awayFired: false,
    lookAwaySince: 0, gazeCenterSince: 0, distractFired: false,
    lastGazeDir: "CENTER" as GazeDirection,
    postureBadSince: 0, postureGoodSince: 0, postureFired: false,
    lastPostureReason: null as PostureReason | null,
    confusedSince: 0, confusionClearSince: 0, confusionFired: false,
  };
}

interface CalibrationState {
  startedAt: number;
  locked: boolean;
  samples: number;
  ears: number[];
  yaws: number[];
  pitches: number[];
  centerXs: number[];
  centerYs: number[];
  faceWidths: number[];
  faceHeights: number[];
  openEar: number;
  eyeThreshold: number;
  neutralYaw: number;
  neutralPitch: number;
  neutralCenterX: number;
  neutralCenterY: number;
  neutralFaceWidth: number;
  neutralFaceHeight: number;
  furrows: number[];
  neutralFurrow: number;
}

function freshCalibration(): CalibrationState {
  return {
    startedAt: 0, locked: false, samples: 0, ears: [], yaws: [], pitches: [], centerXs: [], centerYs: [],
    faceWidths: [], faceHeights: [], openEar: 0.29, eyeThreshold: EAR_CLOSED_THRESHOLD, neutralYaw: 0, neutralPitch: 0,
    neutralCenterX: 0.5, neutralCenterY: 0.48, neutralFaceWidth: 0.28, neutralFaceHeight: 0.42,
    furrows: [], neutralFurrow: 0,
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p)));
  return sorted[idx];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pushWindow(arr: number[], value: number, max: number): number[] {
  if (Number.isFinite(value) && value > 0) {
    arr.push(value);
    if (arr.length > max) arr.splice(0, arr.length - max);
  }
  return arr;
}

type Blend = { categoryName: string; score: number }[];

/** Weighted brow-furrow / squint / lip-press cue from MediaPipe blendshapes. */
function furrowScore(cats: Blend | null): number | null {
  if (!cats || !cats.length) return null;
  const get = (n: string) => cats.find((c) => c.categoryName === n)?.score ?? 0;
  const brow = (get("browDownLeft") + get("browDownRight")) / 2;
  const squint = (get("eyeSquintLeft") + get("eyeSquintRight")) / 2;
  const press = (get("mouthPressLeft") + get("mouthPressRight")) / 2;
  return brow * 0.65 + squint * 0.2 + press * 0.15;
}

/**
 * Real in-browser computer vision with proper temporal detection:
 *  • 5s continuous eye-closure (debounced) → drowsiness
 *  • 3s sustained head-pose look-away → distraction
 *  • 2s continuous phone presence → phone alert
 *  • 5s continuous face loss → away
 * All episodes flow through the central store pipeline (score → event →
 * anti-spam → one intervention at a time).
 */
export function useVisionEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  restartKey = 0,
) {
  const store = useStudyBro();
  const api = useRef(store);
  api.current = store;

  const [live, setLive] = useState<LiveVision>(INITIAL);
  const liveRef = useRef<LiveVision>(INITIAL);
  const setLiveBoth = useCallback((next: LiveVision) => { liveRef.current = next; setLive(next); }, []);

  const raf = useRef<number | null>(null);
  const phonesRef = useRef<PhoneBox[]>([]);
  const objBusy = useRef(false);
  const lastObj = useRef(0);
  const lastSync = useRef(0);
  const lastVideoTime = useRef(-1);
  const lastLandmarksRef = useRef<NormLandmark[] | null>(null);
  const lastMatrixRef = useRef<number[] | Float32Array | null>(null);
  const lastFaceSeenAtRef = useRef(0);
  const faceConfRef = useRef(0);
  const prevCenterRef = useRef<{ x: number; y: number } | null>(null);
  const earHistoryRef = useRef<number[]>([]);
  const leftEarHistoryRef = useRef<number[]>([]);
  const rightEarHistoryRef = useRef<number[]>([]);
  const phoneEvidenceRef = useRef(0);
  const phoneLatchedRef = useRef(false);
  const calibrationRef = useRef<CalibrationState>(freshCalibration());
  const lastBlendRef = useRef<Blend | null>(null);
  const furrowEmaRef = useRef(0);
  const confusionRef = useRef<{ status: ConfusionStatus; level: number }>({ status: "CLEAR", level: 0 });
  const s = useRef(freshEdgeState());

  const clearLiveDetections = useCallback(() => {
    api.current.liveUpdate({
      drowsiness: normalDrowsiness(), phone: normalPhone(), gaze: normalGaze(), posture: normalPosture(), presence: normalPresence(),
    }, { status: "CLEAR", level: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    installVisionLogFilter();
    let cancelled = false;
    let face: Awaited<ReturnType<typeof loadFaceLandmarker>> | null = null;
    let object: Awaited<ReturnType<typeof loadObjectDetector>> | null = null;

    setLiveBoth({ ...INITIAL, status: "loading" });

    (async () => {
      try {
        [face, object] = await Promise.all([loadFaceLandmarker(), loadObjectDetector()]);
      } catch (err) {
        if (!cancelled) {
          setLiveBoth({ ...INITIAL, status: "error", error: "Could not load AI models. Check your internet connection and retry." });
          console.error("[StudyBro] model load failed", err);
        }
        return;
      }
      if (cancelled) return;
      api.current.setMode("live");
      s.current = freshEdgeState();
      calibrationRef.current = freshCalibration();
      calibrationRef.current.startedAt = performance.now();
      earHistoryRef.current = [];
      leftEarHistoryRef.current = [];
      rightEarHistoryRef.current = [];
      phoneEvidenceRef.current = 0;
      phoneLatchedRef.current = false;
      lastFaceSeenAtRef.current = 0;
      lastBlendRef.current = null;
      furrowEmaRef.current = 0;
      confusionRef.current = { status: "CLEAR", level: 0 };
      setLiveBoth({ ...liveRef.current, status: "running", error: null, calibrating: true, calibrationProgress: 0, trackingQuality: "CALIBRATING" });
      loop();
    })();

    function loop() {
      raf.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !face) return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      const t = performance.now();

      frameTimes.current.push(t);
      while (frameTimes.current.length && t - frameTimes.current[0] > 1000) frameTimes.current.shift();
      const fps = frameTimes.current.length;

      let landmarks: NormLandmark[] | null = null;
      let matrix: number[] | Float32Array | null = null;
      let faceWasHeld = false;
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        try {
          const res = face.detectForVideo(video, t);
          if (res.faceLandmarks && res.faceLandmarks.length > 0) {
            landmarks = res.faceLandmarks[0] as unknown as NormLandmark[];
            matrix = res.facialTransformationMatrixes?.[0]?.data ?? null;
            lastBlendRef.current = (res.faceBlendshapes?.[0]?.categories as Blend | undefined) ?? null;
            lastLandmarksRef.current = landmarks;
            lastMatrixRef.current = matrix;
            lastFaceSeenAtRef.current = t;
          } else if (lastLandmarksRef.current && t - lastFaceSeenAtRef.current <= FACE_TRACK_HOLD_MS) {
            // One missed MediaPipe frame should not make the HUD flash FACE NOT DETECTED.
            landmarks = lastLandmarksRef.current;
            matrix = lastMatrixRef.current;
            faceWasHeld = true;
          } else {
            lastLandmarksRef.current = null;
            lastMatrixRef.current = null;
          }
        } catch {
          if (lastLandmarksRef.current && t - lastFaceSeenAtRef.current <= FACE_TRACK_HOLD_MS) {
            landmarks = lastLandmarksRef.current;
            matrix = lastMatrixRef.current;
            faceWasHeld = true;
          }
        }
      } else {
        landmarks = lastLandmarksRef.current;
        matrix = lastMatrixRef.current;
      }

      if (object && !objBusy.current && t - lastObj.current > OBJECT_DETECT_INTERVAL_MS) {
        lastObj.current = t;
        objBusy.current = true;
        object.detect(video, 8)
          .then((preds) => {
            const rawPhones = preds
              .filter((p) => PHONE_CLASSES.includes(p.class.toLowerCase()) && p.score >= PHONE_MIN_CONFIDENCE)
              .map((p) => ({ x: p.bbox[0], y: p.bbox[1], w: p.bbox[2], h: p.bbox[3], score: p.score }));

            if (rawPhones.length > 0) {
              phoneEvidenceRef.current = Math.min(1, phoneEvidenceRef.current + PHONE_EVIDENCE_RISE);
              phonesRef.current = rawPhones;
            } else {
              phoneEvidenceRef.current = Math.max(0, phoneEvidenceRef.current - PHONE_EVIDENCE_FALL);
            }

            if (!phoneLatchedRef.current && phoneEvidenceRef.current >= PHONE_EVIDENCE_ON) {
              phoneLatchedRef.current = true;
            } else if (phoneLatchedRef.current && phoneEvidenceRef.current <= PHONE_EVIDENCE_OFF) {
              phoneLatchedRef.current = false;
              phonesRef.current = [];
            }
          })
          .catch(() => {})
          .finally(() => { objBusy.current = false; });
      }

      const vw = video.videoWidth, vh = video.videoHeight;
      const faceDetected = !!landmarks;
      const cal = calibrationRef.current;
      const elapsedCalibration = cal.startedAt ? t - cal.startedAt : 0;
      let ear = 0, eyesClosed = false, gazeAway = false, gazeDir: GazeDirection = "CENTER", leftOpen = 0, rightOpen = 0;
      let headYaw = 0, headPitch = 0;
      let postureStatus: PostureStatus = "GOOD";
      let postureReason: PostureReason | null = null;
      let postureConfidence = 0;
      let furrowDelta = 0;

      if (landmarks) {
        const e = eyeAspectRatios(landmarks, vw, vh);
        pushWindow(earHistoryRef.current, e.avg, EAR_SMOOTH_WINDOW);
        pushWindow(leftEarHistoryRef.current, e.left, EAR_SMOOTH_WINDOW);
        pushWindow(rightEarHistoryRef.current, e.right, EAR_SMOOTH_WINDOW);
        ear = median(earHistoryRef.current) || e.avg;
        const leftEar = median(leftEarHistoryRef.current) || e.left;
        const rightEar = median(rightEarHistoryRef.current) || e.right;
        leftOpen = openness(leftEar, Math.max(0.1, cal.eyeThreshold * 0.82), Math.max(0.27, cal.openEar));
        rightOpen = openness(rightEar, Math.max(0.1, cal.eyeThreshold * 0.82), Math.max(0.27, cal.openEar));

        const g = estimateGaze(landmarks, matrix);
        const box = faceBox(landmarks, vw, vh);
        const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
        const faceWidth = (box.maxX - box.minX) / vw;
        const faceHeight = (box.maxY - box.minY) / vh;
        const centerX = cx / vw;
        const centerY = cy / vh;

        const diag = Math.hypot(box.maxX - box.minX, box.maxY - box.minY) || 1;
        const prev = prevCenterRef.current;
        const move = prev ? Math.hypot(cx - prev.x, cy - prev.y) / diag : 0;
        prevCenterRef.current = { x: cx, y: cy };
        const target = Math.max(0.82, Math.min(0.995, 0.995 - move * 1.5 - (faceWasHeld ? 0.08 : 0)));
        faceConfRef.current = faceConfRef.current ? faceConfRef.current * 0.88 + target * 0.12 : target;

        // Person-specific calibration. Use robust percentiles/medians so a blink
        // or a brief head movement during calibration does not poison the baseline.
        if (!cal.locked && !faceWasHeld && e.avg > 0.11 && e.avg < 0.48 && Math.abs(g.yaw) < 38 && Math.abs(g.pitch) < 45) {
          cal.samples += 1;
          cal.ears.push(e.avg);
          cal.yaws.push(g.yaw);
          cal.pitches.push(g.pitch);
          cal.centerXs.push(centerX);
          cal.centerYs.push(centerY);
          cal.faceWidths.push(faceWidth);
          cal.faceHeights.push(faceHeight);
          const f = furrowScore(lastBlendRef.current);
          if (f != null) cal.furrows.push(f);
        }

        if (!cal.locked && elapsedCalibration >= VISION_CALIBRATION_MS && cal.samples >= VISION_MIN_CALIBRATION_SAMPLES) {
          cal.openEar = percentile(cal.ears, 0.72) || 0.29;
          cal.eyeThreshold = clamp(cal.openEar * EAR_CLOSED_RATIO, EAR_THRESHOLD_MIN, EAR_THRESHOLD_MAX);
          cal.neutralYaw = median(cal.yaws);
          cal.neutralPitch = median(cal.pitches);
          cal.neutralCenterX = median(cal.centerXs) || centerX;
          cal.neutralCenterY = median(cal.centerYs) || centerY;
          cal.neutralFaceWidth = median(cal.faceWidths) || faceWidth;
          cal.neutralFaceHeight = median(cal.faceHeights) || faceHeight;
          cal.neutralFurrow = median(cal.furrows);
          furrowEmaRef.current = cal.neutralFurrow;
          cal.locked = true;
          s.current = freshEdgeState();
          phoneEvidenceRef.current = 0;
          phoneLatchedRef.current = false;
          phonesRef.current = [];
          api.current.pushSystemEvent("🎯", "Vision calibration locked — accuracy profile active");
        }

        if (cal.locked) {
          headYaw = g.yaw - cal.neutralYaw;
          headPitch = g.pitch - cal.neutralPitch;

          const poseReliableForEyes = Math.abs(headYaw) <= DROWSY_MAX_YAW_DEG && Math.abs(headPitch) <= DROWSY_MAX_PITCH_DEG;
          const bothEyesConsistent = Math.abs(leftEar - rightEar) <= Math.max(0.085, cal.openEar * 0.34);
          eyesClosed = poseReliableForEyes && bothEyesConsistent && ear < cal.eyeThreshold;

          const absYaw = Math.abs(headYaw);
          gazeAway = absYaw >= GAZE_YAW_DISTRACT_DEG || headPitch <= -GAZE_UP_DISTRACT_DEG || headPitch >= GAZE_DOWN_DISTRACT_DEG;
          if (gazeAway) {
            if (absYaw >= Math.max(Math.abs(headPitch) * 0.85, GAZE_YAW_DISTRACT_DEG)) {
              gazeDir = headYaw > 0 ? "LEFT" : "RIGHT";
            } else {
              gazeDir = headPitch > 0 ? "DOWN" : "UP";
            }
          }

          const posture = estimatePosture(
            faceWidth, faceHeight, centerX, centerY, headYaw,
            cal.neutralFaceWidth, cal.neutralFaceHeight, cal.neutralCenterX, cal.neutralCenterY,
          );
          postureStatus = posture.status;
          postureReason = posture.reason;
          postureConfidence = posture.confidence;

          const f = furrowScore(lastBlendRef.current);
          if (f != null && !faceWasHeld) {
            furrowEmaRef.current = furrowEmaRef.current * (1 - CONFUSION_EMA_ALPHA) + f * CONFUSION_EMA_ALPHA;
          }
          furrowDelta = Math.max(0, furrowEmaRef.current - cal.neutralFurrow);
        }
      } else {
        prevCenterRef.current = null;
        faceConfRef.current = Math.max(0, faceConfRef.current * 0.82);
      }

      const calibrating = !cal.locked;
      const calibrationProgress = cal.locked
        ? 100
        : Math.round(Math.min(99, Math.min(elapsedCalibration / VISION_CALIBRATION_MS, cal.samples / VISION_MIN_CALIBRATION_SAMPLES) * 100));

      const phones = phonesRef.current;
      const phonePresent = !calibrating && phoneLatchedRef.current;
      const phoneConf = phones.length > 0 ? Math.max(...phones.map((p) => p.score)) : liveRef.current.phoneConfidence;

      if (!calibrating) {
        runEpisodes(t, faceDetected, ear, eyesClosed, phonePresent, phoneConf, gazeAway, gazeDir, postureStatus, postureReason, postureConfidence);
        runConfusion(t, faceDetected && !eyesClosed && !gazeAway && !phonePresent, furrowDelta);
      } else {
        // Never carry an alert timer through calibration.
        s.current = freshEdgeState();
      }

      const drowsy = calibrating ? "NORMAL" : drowsyLabel(t);
      const distracted = !calibrating && faceDetected && !!s.current.lookAwaySince && t - s.current.lookAwaySince >= effectiveDistractionMs();

      draw(canvas, video, {
        landmarks, phones, fps, t, faceConf: faceConfRef.current, leftOpen, rightOpen, ear,
        eyesClosed, drowsy, gazeDir, gazeAway, distracted, distractDir: s.current.lastGazeDir,
        phonePresent, phoneConf,
        phoneUsageMs: s.current.phonePresentSince ? t - s.current.phonePresentSince : 0,
        headYaw, headPitch, postureStatus, postureReason, postureConfidence,
        showLandmarks: api.current.settings.showLandmarks,
      });

      if (t - lastSync.current > STORE_SYNC_INTERVAL_MS) {
        lastSync.current = t;
        syncLive(t, faceDetected, ear, eyesClosed, leftOpen, rightOpen, phonePresent, phoneConf, gazeAway, gazeDir, headYaw, headPitch, postureStatus, postureReason, postureConfidence, fps, calibrating, calibrationProgress, faceWasHeld);
      }
    }

    /** Confusion cue: sustained brow furrow while looking at the material. */
    function runConfusion(t: number, eligible: boolean, delta: number) {
      const st = s.current;
      const level = clamp(delta / (CONFUSION_PUZZLED_DELTA * 1.6), 0, 1);
      const puzzled = eligible && delta >= CONFUSION_PUZZLED_DELTA;
      if (puzzled) {
        if (!st.confusedSince) st.confusedSince = t;
        st.confusionClearSince = 0;
      } else if (st.confusedSince) {
        if (!st.confusionClearSince) st.confusionClearSince = t;
        if (t - st.confusionClearSince > CONFUSION_CLEAR_DEBOUNCE_MS || !eligible) {
          st.confusedSince = 0; st.confusionClearSince = 0; st.confusionFired = false;
        }
      }
      const held = !!st.confusedSince && t - st.confusedSince >= CONFUSION_CONFIRM_MS;
      if (held && !st.confusionFired) {
        st.confusionFired = true;
        api.current.reportConfusion("live");
      }
      confusionRef.current = {
        status: !eligible ? "CLEAR" : st.confusedSince ? "PUZZLED" : delta >= CONFUSION_THINKING_DELTA ? "THINKING" : "CLEAR",
        level: eligible ? level : 0,
      };
    }

    function effectiveDrowsyMs() { return Math.max(api.current.settings.drowsinessThresholdMs, DROWSY_CRITICAL_MS); }
    function effectiveDistractionMs() { return Math.max(api.current.settings.distractionThresholdMs, DISTRACTION_MS); }
    function effectivePhoneMs() { return Math.max(api.current.settings.phoneThresholdMs, PHONE_CONFIRM_MS); }
    function effectiveAwayMs() { return Math.max(api.current.settings.awayThresholdMs, AWAY_MS); }
    function effectivePostureMs() { return Math.max(api.current.settings.postureThresholdMs, POSTURE_CONFIRM_MS); }

    function drowsyLabel(t: number): "NORMAL" | "WARNING" | "CRITICAL" {
      const st = s.current;
      if (!st.eyesClosedSince) return "NORMAL";
      const closedMs = t - st.eyesClosedSince;
      return closedMs >= effectiveDrowsyMs() ? "CRITICAL" : closedMs >= DROWSY_WARNING_MS ? "WARNING" : "NORMAL";
    }

    function runEpisodes(
      t: number, faceDetected: boolean, ear: number, eyesClosed: boolean,
      phonePresent: boolean, phoneConf: number, gazeAway: boolean, gazeDir: GazeDirection,
      postureStatus: PostureStatus, postureReason: PostureReason | null, postureConfidence: number,
    ) {
      const st = s.current;
      const now = Date.now();

      // ---- Presence first: when the face is actually gone, all other behavior
      // detectors are reset. This prevents stale eye/gaze/posture events.
      if (faceDetected) {
        if (st.faceLostSince) {
          if (!st.faceSeenSince) st.faceSeenSince = t;
          if (t - st.faceSeenSince > FACE_LOSS_DEBOUNCE_MS) {
            if (st.awayFired) api.current.pushSystemEvent("👋", "Welcome back, Bro! 👋");
            st.faceLostSince = 0; st.faceSeenSince = 0; st.awayFired = false;
          }
        } else {
          st.faceSeenSince = 0;
        }
      } else {
        st.faceSeenSince = 0;
        if (!st.faceLostSince) st.faceLostSince = t;
        st.eyesClosedSince = 0; st.eyesOpenSince = 0; st.drowsyFired = false;
        st.lookAwaySince = 0; st.gazeCenterSince = 0; st.distractFired = false;
        st.postureBadSince = 0; st.postureGoodSince = 0; st.postureFired = false; st.lastPostureReason = null;
        if (t - st.faceLostSince >= effectiveAwayMs() && !st.awayFired) {
          st.awayFired = true;
          api.current.ingest(realAwayEpisode(now));
        }
      }

      // ---- Phone: the object detector already uses multi-frame evidence.
      // A detected phone is a more specific cause than gaze/posture, so those
      // lower-priority timers are suspended while phone evidence is active.
      if (phonePresent) {
        if (!st.phonePresentSince) st.phonePresentSince = t;
        st.phoneLostSince = 0;
      } else if (st.phonePresentSince) {
        if (!st.phoneLostSince) st.phoneLostSince = t;
        if (t - st.phoneLostSince > PHONE_LOSS_DEBOUNCE_MS) {
          st.phonePresentSince = 0; st.phoneLostSince = 0; st.phoneFired = false;
        }
      }
      if (st.phonePresentSince && !st.phoneFired && t - st.phonePresentSince >= effectivePhoneMs()) {
        st.phoneFired = true;
        api.current.ingest(realPhoneEpisode(now, phoneConf, t - st.phonePresentSince));
      }

      // ---- Drowsiness: person-adaptive EAR + smoothing + head-pose gate.
      if (faceDetected && eyesClosed && !phonePresent) {
        if (!st.eyesClosedSince) st.eyesClosedSince = t;
        st.eyesOpenSince = 0;
      } else if (faceDetected && !eyesClosed) {
        if (st.eyesClosedSince) {
          if (!st.eyesOpenSince) st.eyesOpenSince = t;
          if (t - st.eyesOpenSince > EYE_OPEN_DEBOUNCE_MS) {
            st.eyesClosedSince = 0; st.eyesOpenSince = 0; st.drowsyFired = false;
          }
        }
      } else if (!faceDetected || phonePresent) {
        st.eyesClosedSince = 0; st.eyesOpenSince = 0; st.drowsyFired = false;
      }
      if (st.eyesClosedSince && !st.drowsyFired) {
        const closedMs = t - st.eyesClosedSince;
        if (closedMs >= effectiveDrowsyMs()) {
          st.drowsyFired = true;
          const threshold = calibrationRef.current.eyeThreshold;
          const conf = clamp(0.78 + Math.max(0, threshold - ear) * 3.5 + Math.min(0.12, closedMs / 60000), 0.78, 0.99);
          api.current.ingest(realDrowsyEpisode(now, ear, conf, closedMs / 1000));
        }
      }

      const drowsyCandidate = !!st.eyesClosedSince;
      const specificPhoneActive = !!st.phonePresentSince;

      // ---- Distraction: only when a more specific condition is not active.
      // This prevents "looking at phone" from generating both phone and gaze
      // interventions at the same time.
      if (faceDetected && gazeAway && !specificPhoneActive && !drowsyCandidate) {
        if (!st.lookAwaySince) st.lookAwaySince = t;
        st.lastGazeDir = gazeDir;
        st.gazeCenterSince = 0;
      } else if (faceDetected && !gazeAway && !specificPhoneActive && !drowsyCandidate) {
        if (st.lookAwaySince) {
          if (!st.gazeCenterSince) st.gazeCenterSince = t;
          if (t - st.gazeCenterSince > GAZE_CENTER_DEBOUNCE_MS) {
            st.lookAwaySince = 0; st.gazeCenterSince = 0; st.distractFired = false;
          }
        }
      } else {
        st.lookAwaySince = 0; st.gazeCenterSince = 0; st.distractFired = false;
      }
      if (st.lookAwaySince && !st.distractFired && t - st.lookAwaySince >= effectiveDistractionMs()) {
        st.distractFired = true;
        const duration = (t - st.lookAwaySince) / 1000;
        const yawStrength = Math.min(1, Math.abs(liveRef.current.headYaw) / 45);
        api.current.ingest(realDistractionEpisode(now, st.lastGazeDir, clamp(0.82 + yawStrength * 0.15, 0.82, 0.97), duration));
      }

      const distractionCandidate = !!st.lookAwaySince || gazeAway;

      // ---- Posture: never evaluate during a deliberate head turn, phone use,
      // or eye-closure episode. This fixes the recording's false "SIT UP" alert
      // after a distraction test.
      const postureEligible = faceDetected && !specificPhoneActive && !drowsyCandidate && !distractionCandidate;
      if (postureEligible && postureStatus !== "GOOD" && postureReason) {
        if (!st.postureBadSince || st.lastPostureReason !== postureReason) {
          st.postureBadSince = t;
          st.postureFired = false;
        }
        st.lastPostureReason = postureReason;
        st.postureGoodSince = 0;
      } else if (faceDetected) {
        if (st.postureBadSince) {
          if (!st.postureGoodSince) st.postureGoodSince = t;
          if (t - st.postureGoodSince > POSTURE_GOOD_DEBOUNCE_MS) {
            st.postureBadSince = 0; st.postureGoodSince = 0; st.postureFired = false; st.lastPostureReason = null;
          }
        }
      } else {
        st.postureBadSince = 0; st.postureGoodSince = 0; st.postureFired = false; st.lastPostureReason = null;
      }
      if (st.postureBadSince && st.lastPostureReason && !st.postureFired && t - st.postureBadSince >= effectivePostureMs()) {
        st.postureFired = true;
        api.current.ingest(realPostureEpisode(now, st.lastPostureReason, Math.max(0.8, postureConfidence)));
      }
    }

    function syncLive(
      t: number, faceDetected: boolean, ear: number, eyesClosed: boolean,
      leftOpen: number, rightOpen: number, phonePresent: boolean, phoneConf: number,
      gazeAway: boolean, gazeDir: GazeDirection, headYaw: number, headPitch: number,
      postureStatus: PostureStatus, postureReason: PostureReason | null, postureConfidence: number, fps: number,
      calibrating: boolean, calibrationProgress: number, faceWasHeld: boolean,
    ) {
      const st = s.current;
      const now = Date.now();
      const threshold = calibrationRef.current.eyeThreshold;
      const drowsy = calibrating ? "NORMAL" : drowsyLabel(t);
      const phoneActive = !calibrating && !!st.phonePresentSince;
      const phoneUsageMs = phoneActive ? t - st.phonePresentSince : 0;
      const stablePhoneConf = phonePresent
        ? phoneConf
        : phoneActive
          ? liveRef.current.phoneConfidence
          : 0;
      const distracted = !calibrating && faceDetected && !!st.lookAwaySince && t - st.lookAwaySince >= effectiveDistractionMs();
      const gazeStatus: LiveVision["gaze"] = calibrating
        ? "FOCUSED"
        : distracted
          ? "DISTRACTED"
          : gazeAway && faceDetected
            ? "SLIGHTLY_DISTRACTED"
            : "FOCUSED";
      const away = !calibrating && st.awayFired;
      const stablePostureStatus: PostureStatus = calibrating
        ? "GOOD"
        : st.postureFired
          ? "BAD"
          : st.postureBadSince
            ? (postureStatus === "GOOD" ? "WARNING" : postureStatus)
            : postureStatus;
      const stablePostureReason = calibrating ? null : st.postureBadSince ? st.lastPostureReason : postureReason;
      const stablePostureConfidence = calibrating
        ? 0
        : st.postureBadSince && postureConfidence === 0
          ? liveRef.current.postureConfidence
          : postureConfidence;

      const displayDir: GazeDirection = calibrating ? "CENTER" : distracted ? st.lastGazeDir : gazeAway ? gazeDir : "CENTER";
      const trackingQuality: LiveVision["trackingQuality"] = calibrating
        ? "CALIBRATING"
        : faceWasHeld || (!faceDetected && faceConfRef.current > 0.15)
          ? "DEGRADED"
          : "LOCKED";

      setLiveBoth({
        status: "running", error: null, fps, face: faceDetected, faceConfidence: faceConfRef.current,
        ear, eyesClosed: calibrating ? false : eyesClosed, leftOpen, rightOpen, drowsy, phone: phoneActive,
        phoneConfidence: stablePhoneConf, phoneUsageMs, gaze: gazeStatus, gazeDirection: displayDir,
        headYaw, headPitch, posture: stablePostureStatus, postureReason: stablePostureReason, postureConfidence: stablePostureConfidence,
        calibrating, calibrationProgress, eyeThreshold: threshold, trackingQuality,
        confusion: calibrating ? "CLEAR" : confusionRef.current.status,
        confusionLevel: calibrating ? 0 : confusionRef.current.level,
      });

      const eyeState = calibrating
        ? "open"
        : eyesClosed
          ? "closed"
          : ear > 0 && ear < threshold * 1.16
            ? "closing"
            : "open";
      const drowsyConfidence = drowsy === "NORMAL"
        ? clamp((threshold - ear) / Math.max(0.04, threshold * 0.35), 0, 0.45)
        : clamp(0.78 + Math.max(0, threshold - ear) * 3.5, 0.78, 0.99);

      api.current.liveUpdate({
        drowsiness: {
          status: drowsy,
          eyeState,
          confidence: drowsyConfidence,
          lastDetected: drowsy !== "NORMAL" ? now : null,
        },
        phone: {
          status: phoneActive ? "DETECTED" : "NOT_DETECTED",
          confidence: stablePhoneConf, usageDurationMs: phoneUsageMs, lastDetected: phoneActive ? now : null,
        },
        gaze: {
          status: gazeStatus, direction: displayDir,
          distractionDurationMs: st.lookAwaySince ? t - st.lookAwaySince : 0,
          confidence: calibrating ? 0.5 : faceDetected ? (trackingQuality === "LOCKED" ? 0.92 : 0.68) : 0.35,
          lastDetected: distracted ? now : null,
        },
        posture: {
          status: stablePostureStatus,
          reason: stablePostureReason,
          confidence: stablePostureConfidence,
          lastDetected: stablePostureStatus !== "GOOD" ? now : null,
        },
        presence: {
          status: away ? "AWAY" : "PRESENT", faceDetected,
          awayDurationMs: away && st.faceLostSince ? t - st.faceLostSince : 0,
          lastDetected: faceDetected ? now : null,
        },
      }, calibrating ? { status: "CLEAR", level: 0 } : { ...confusionRef.current });
    }

    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      phonesRef.current = [];
      lastLandmarksRef.current = null;
      lastMatrixRef.current = null;
      lastFaceSeenAtRef.current = 0;
      earHistoryRef.current = [];
      leftEarHistoryRef.current = [];
      rightEarHistoryRef.current = [];
      phoneEvidenceRef.current = 0;
      phoneLatchedRef.current = false;
      calibrationRef.current = freshCalibration();
      frameTimes.current = [];
      // Clear the live snapshot while the store is still in live mode so an
      // open condition-controlled intervention is closed as part of recovery.
      lastBlendRef.current = null;
      confusionRef.current = { status: "CLEAR", level: 0 };
      clearLiveDetections();
      api.current.setMode("demo");
      setLiveBoth({ ...INITIAL, status: "idle" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, restartKey]);

  return live;
}


function estimatePosture(
  faceWidth: number,
  faceHeight: number,
  centerX: number,
  centerY: number,
  relativeYaw: number,
  neutralFaceWidth: number,
  neutralFaceHeight: number,
  neutralCenterX: number,
  neutralCenterY: number,
): { status: PostureStatus; reason: PostureReason | null; confidence: number } {
  // Posture is evaluated relative to the student's calibrated neutral position.
  // A deliberate side-look belongs to the distraction detector, not posture.
  if (Math.abs(relativeYaw) > POSTURE_MAX_YAW_FOR_EVAL) {
    return { status: "GOOD", reason: null, confidence: 0.72 };
  }

  const safeBaseH = Math.max(0.08, neutralFaceHeight);
  const safeBaseW = Math.max(0.06, neutralFaceWidth);
  const sizeRatio = Math.max(faceHeight / safeBaseH, faceWidth / safeBaseW);
  const dx = Math.abs(centerX - neutralCenterX);
  const dy = centerY - neutralCenterY;

  if (sizeRatio >= POSTURE_TOO_CLOSE_RATIO_BAD) {
    return { status: "BAD", reason: "Too close to screen", confidence: clamp(0.82 + (sizeRatio - POSTURE_TOO_CLOSE_RATIO_BAD) * 0.35, 0.82, 0.98) };
  }
  if (dy >= POSTURE_CENTER_Y_BAD_DELTA) {
    return { status: "BAD", reason: "Head too low", confidence: clamp(0.82 + (dy - POSTURE_CENTER_Y_BAD_DELTA) * 0.8, 0.82, 0.97) };
  }
  if (dx >= POSTURE_CENTER_X_BAD_DELTA) {
    return { status: "BAD", reason: "Leaning", confidence: clamp(0.82 + (dx - POSTURE_CENTER_X_BAD_DELTA) * 0.8, 0.82, 0.96) };
  }
  if (sizeRatio >= POSTURE_TOO_CLOSE_RATIO_WARN) {
    return { status: "WARNING", reason: "Too close to screen", confidence: 0.78 };
  }
  if (dy >= POSTURE_CENTER_Y_WARN_DELTA) {
    return { status: "WARNING", reason: "Slouching", confidence: 0.76 };
  }
  if (dx >= POSTURE_CENTER_X_WARN_DELTA) {
    return { status: "WARNING", reason: "Leaning", confidence: 0.75 };
  }
  return { status: "GOOD", reason: null, confidence: 0.93 };
}

const frameTimes = { current: [] as number[] };

/* ----------------------------- Drawing ----------------------------- */

interface DrawInput {
  landmarks: NormLandmark[] | null;
  phones: PhoneBox[];
  fps: number;
  t: number;
  faceConf: number;
  leftOpen: number;
  rightOpen: number;
  ear: number;
  eyesClosed: boolean;
  drowsy: "NORMAL" | "WARNING" | "CRITICAL";
  gazeDir: GazeDirection;
  gazeAway: boolean;
  distracted: boolean;
  distractDir: GazeDirection;
  phonePresent: boolean;
  phoneConf: number;
  phoneUsageMs: number;
  headYaw: number;
  headPitch: number;
  postureStatus: PostureStatus;
  postureReason: PostureReason | null;
  postureConfidence: number;
  showLandmarks: boolean;
}

const C = {
  green: "52, 211, 153", amber: "251, 191, 36", red: "251, 113, 133",
  cyan: "34, 211, 238", violet: "167, 139, 250", soft: "148, 197, 255",
};

export function faceBox(lm: NormLandmark[], vw: number, vh: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const l of lm) {
    const x = l.x * vw, y = l.y * vh;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function strokePath(ctx: CanvasRenderingContext2D, lm: NormLandmark[], conns: { start: number; end: number }[], vw: number, vh: number, color: string, lw: number) {
  if (!conns || conns.length === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (const c of conns) {
    const a = lm[c.start], b = lm[c.end];
    if (!a || !b) continue;
    ctx.moveTo(a.x * vw, a.y * vh);
    ctx.lineTo(b.x * vw, b.y * vh);
  }
  ctx.stroke();
}

function irisCentroid(lm: NormLandmark[], conns: { start: number; end: number }[], vw: number, vh: number) {
  const idx = new Set<number>();
  for (const c of conns) { idx.add(c.start); idx.add(c.end); }
  let x = 0, y = 0, n = 0;
  idx.forEach((i) => { if (lm[i]) { x += lm[i].x * vw; y += lm[i].y * vh; n++; } });
  return n ? { x: x / n, y: y / n } : null;
}

function draw(canvas: HTMLCanvasElement, video: HTMLVideoElement, input: DrawInput) {
  const { landmarks, phones, fps, t, faceConf, leftOpen, rightOpen, eyesClosed, drowsy, gazeDir, gazeAway, distracted, distractDir, phonePresent, phoneConf, headYaw, headPitch, postureStatus, postureReason, showLandmarks } = input;
  void fps;
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const u = vw / 640;
  ctx.clearRect(0, 0, vw, vh);
  ctx.lineJoin = "round";
  ctx.textBaseline = "alphabetic";

  // subtle scan line
  const scanPhase = (t % 3200) / 3200;
  const scanY = scanPhase * vh;
  const grad = ctx.createLinearGradient(0, scanY - 26 * u, 0, scanY + 26 * u);
  grad.addColorStop(0, `rgba(${C.cyan}, 0)`);
  grad.addColorStop(0.5, `rgba(${C.cyan}, 0.07)`);
  grad.addColorStop(1, `rgba(${C.cyan}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY - 26 * u, vw, 52 * u);

  const conns = getFaceConnections();

  if (landmarks) {
    const box = faceBox(landmarks, vw, vh);
    const pad = 8 * u;
    const bx = box.minX - pad, by = box.minY - pad * 2;
    const bw = box.maxX - box.minX + pad * 2, bh = box.maxY - box.minY + pad * 3;
    const stateColor = drowsy === "CRITICAL" ? C.red : postureStatus === "BAD" ? C.red : drowsy === "WARNING" || distracted || postureStatus === "WARNING" ? C.amber : C.green;

    // ---- Clean, minimal landmarks (no dense mesh) ----
    if (showLandmarks && conns) {
      strokePath(ctx, landmarks, conns.faceOval, vw, vh, `rgba(${C.cyan}, 0.35)`, 1.4 * u);
      strokePath(ctx, landmarks, conns.leftEyebrow, vw, vh, `rgba(${C.soft}, 0.7)`, 1.4 * u);
      strokePath(ctx, landmarks, conns.rightEyebrow, vw, vh, `rgba(${C.soft}, 0.7)`, 1.4 * u);
      strokePath(ctx, landmarks, conns.lips, vw, vh, `rgba(${C.soft}, 0.7)`, 1.4 * u);
      const eyeCol = eyesClosed ? `rgba(${C.red}, 0.95)` : `rgba(${C.cyan}, 0.95)`;
      strokePath(ctx, landmarks, conns.leftEye, vw, vh, eyeCol, 2 * u);
      strokePath(ctx, landmarks, conns.rightEye, vw, vh, eyeCol, 2 * u);
      // iris dots
      for (const iris of [conns.leftIris, conns.rightIris]) {
        const c = irisCentroid(landmarks, iris, vw, vh);
        if (c) {
          ctx.fillStyle = `rgba(${C.cyan}, 0.95)`;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 2.4 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ---- Animated corner-bracket box ----
    const pulse = 0.65 + 0.35 * Math.abs(Math.sin(t / 500));
    drawBrackets(ctx, bx, by, bw, bh, Math.min(28 * u, bw / 3), 3 * u, stateColor, pulse);

    // ---- Face label ----
    labelChip(ctx, `FACE DETECTED  ${(faceConf * 100).toFixed(1)}%`, bx, by - 8 * u, stateColor, u);

    // ---- Per-eye labels ----
    const lc = eyeCentroid(landmarks, LEFT_EYE, vw, vh);
    const rc = eyeCentroid(landmarks, RIGHT_EYE, vw, vh);
    const eyeTxtColor = eyesClosed ? C.red : C.green;
    const openTxt = (o: number) => (eyesClosed ? "CLOSED" : `OPEN ${Math.round(o * 100)}%`);
    smallTag(ctx, `L · ${openTxt(leftOpen)}`, lc.x, lc.y - 14 * u, eyeTxtColor, u);
    smallTag(ctx, `R · ${openTxt(rightOpen)}`, rc.x, rc.y - 14 * u, eyeTxtColor, u);
  } else {
    ctx.fillStyle = `rgba(${C.amber}, 0.95)`;
    ctx.font = `bold ${20 * u}px ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("FACE NOT DETECTED", vw / 2, vh / 2 - 6 * u);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `${13 * u}px ui-sans-serif, system-ui`;
    ctx.fillText("Please sit in front of the camera.", vw / 2, vh / 2 + 18 * u);
    ctx.textAlign = "left";
  }

  // ---- Phone boxes ----
  for (const p of phones) {
    const pulse = 0.65 + 0.35 * Math.abs(Math.sin(t / 400));
    drawBrackets(ctx, p.x, p.y, p.w, p.h, Math.min(22 * u, p.w / 3), 3 * u, C.red, pulse);
    ctx.strokeStyle = `rgba(${C.red}, 0.25)`;
    ctx.lineWidth = 1 * u;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    labelChip(ctx, `📱 PHONE  ${(p.score * 100).toFixed(1)}%`, p.x, Math.max(16 * u, p.y - 8 * u), C.red, u);
  }

  drawStatusBar(ctx, vw, vh, u, { eyesClosed, drowsy, phonePresent, phoneConf, gazeDir, distractDir, gazeAway, distracted, face: !!landmarks, postureStatus, postureReason, headYaw, headPitch });
}

function eyeCentroid(lm: NormLandmark[], idx: number[], vw: number, vh: number) {
  let x = 0, y = 0;
  for (const i of idx) { x += lm[i].x * vw; y += lm[i].y * vh; }
  return { x: x / idx.length, y: y / idx.length };
}

function drawBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, len: number, lw: number, color: string, alpha: number) {
  ctx.strokeStyle = `rgba(${color}, ${alpha})`;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  const seg: [number, number, number, number][] = [
    [x, y + len, x, y], [x, y, x + len, y],
    [x + w - len, y, x + w, y], [x + w, y, x + w, y + len],
    [x + w, y + h - len, x + w, y + h], [x + w, y + h, x + w - len, y + h],
    [x + len, y + h, x, y + h], [x, y + h, x, y + h - len],
  ];
  ctx.beginPath();
  for (const a of seg) { ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); }
  ctx.stroke();
  ctx.lineCap = "butt";
}

function labelChip(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, u: number) {
  ctx.font = `bold ${12 * u}px ui-sans-serif, system-ui`;
  const tw = ctx.measureText(text).width;
  const py = Math.max(0, y - 15 * u);
  roundRect(ctx, x, py, tw + 12 * u, 19 * u, 5 * u);
  ctx.fillStyle = `rgba(${color}, 0.92)`;
  ctx.fill();
  ctx.fillStyle = "#0a0e1a";
  ctx.fillText(text, x + 6 * u, py + 13.5 * u);
}

function smallTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, u: number) {
  ctx.font = `600 ${10 * u}px ui-sans-serif, system-ui`;
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(6,10,18,0.72)";
  roundRect(ctx, x - tw / 2 - 5 * u, y - 12 * u, tw + 10 * u, 15 * u, 4 * u);
  ctx.fill();
  ctx.fillStyle = `rgba(${color}, 0.98)`;
  ctx.fillText(text, x - tw / 2, y - 1.5 * u);
}

function drawStatusBar(
  ctx: CanvasRenderingContext2D, vw: number, vh: number, u: number,
  s: { eyesClosed: boolean; drowsy: string; phonePresent: boolean; phoneConf: number; gazeDir: GazeDirection; distractDir: GazeDirection; gazeAway: boolean; distracted: boolean; face: boolean; postureStatus: PostureStatus; postureReason: PostureReason | null; headYaw: number; headPitch: number },
) {
  const barH = 26 * u, y = vh - barH;
  ctx.fillStyle = "rgba(6,10,18,0.6)";
  ctx.fillRect(0, y, vw, barH);
  const gazeTxt = s.distracted ? `DISTRACTED — ${s.distractDir}` : s.gazeAway && s.face ? `LOOKING ${s.gazeDir}` : "FOCUSED";
  const segs: [string, string][] = [
    [`EYES: ${s.face ? (s.eyesClosed ? "CLOSED" : "OPEN") : "—"}`, s.eyesClosed ? C.red : C.green],
    [`DROWSINESS: ${s.drowsy}`, s.drowsy === "CRITICAL" ? C.red : s.drowsy === "WARNING" ? C.amber : C.green],
    [`PHONE: ${s.phonePresent ? `${(s.phoneConf * 100).toFixed(0)}%` : "NONE"}`, s.phonePresent ? C.red : C.green],
    [`GAZE: ${gazeTxt}`, s.distracted ? C.red : s.gazeAway ? C.amber : C.green],
    [`POSTURE: ${s.postureStatus}${s.postureReason ? ` · ${s.postureReason.toUpperCase()}` : ""}`, s.postureStatus === "BAD" ? C.red : s.postureStatus === "WARNING" ? C.amber : C.green],
    [`HEAD: ${Math.round(s.headYaw)}°/${Math.round(s.headPitch)}°`, C.cyan],
  ];
  ctx.font = `600 ${9.5 * u}px ui-monospace, monospace`;
  ctx.textBaseline = "middle";
  let cx = 10 * u;
  for (const [txt, col] of segs) {
    ctx.fillStyle = `rgba(${col}, 0.5)`;
    ctx.beginPath();
    ctx.arc(cx + 3 * u, y + barH / 2, 3 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${col}, 0.95)`;
    ctx.fillText(txt, cx + 10 * u, y + barH / 2 + 0.5 * u);
    cx += ctx.measureText(txt).width + 22 * u;
  }
  ctx.textBaseline = "alphabetic";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
