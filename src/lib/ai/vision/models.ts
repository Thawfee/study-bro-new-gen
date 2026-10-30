/* Lazy, client-only loaders for the two real models. Cached as singletons
   so navigating between pages never re-downloads them. */

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { ObjectDetection } from "@tensorflow-models/coco-ssd";
import { FACE_LANDMARKER_MODEL, MEDIAPIPE_WASM } from "./visionConfig";

let facePromise: Promise<FaceLandmarker> | null = null;
let objectPromise: Promise<ObjectDetection> | null = null;

/** MediaPipe landmark connection sets (for drawing a clean, minimal overlay). */
type Conn = { start: number; end: number }[];
export interface FaceConnections {
  leftEye: Conn;
  rightEye: Conn;
  leftEyebrow: Conn;
  rightEyebrow: Conn;
  faceOval: Conn;
  lips: Conn;
  leftIris: Conn;
  rightIris: Conn;
}
let faceConnections: FaceConnections | null = null;
export function getFaceConnections(): FaceConnections | null {
  return faceConnections;
}

/** MediaPipe Face Landmarker (468 landmarks) in VIDEO mode. */
export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!facePromise) {
    facePromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const FL = vision.FaceLandmarker;
      faceConnections = {
        leftEye: FL.FACE_LANDMARKS_LEFT_EYE,
        rightEye: FL.FACE_LANDMARKS_RIGHT_EYE,
        leftEyebrow: FL.FACE_LANDMARKS_LEFT_EYEBROW,
        rightEyebrow: FL.FACE_LANDMARKS_RIGHT_EYEBROW,
        faceOval: FL.FACE_LANDMARKS_FACE_OVAL,
        lips: FL.FACE_LANDMARKS_LIPS,
        leftIris: FL.FACE_LANDMARKS_LEFT_IRIS ?? [],
        rightIris: FL.FACE_LANDMARKS_RIGHT_IRIS ?? [],
      };
      const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
      return FL.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        // Slightly lower detection/presence floor improves tracking when a
        // student looks down at notes without making the temporal behavior
        // detectors more trigger-happy. The alert layer still requires several
        // seconds of stable evidence.
        minFaceDetectionConfidence: 0.45,
        minFacePresenceConfidence: 0.45,
        minTrackingConfidence: 0.5,
        outputFacialTransformationMatrixes: true, // head pose for gaze
        outputFaceBlendshapes: true, // brow-furrow "confusion cue" for the AI Coach
      });
    })().catch((err) => {
      facePromise = null; // allow retry
      throw err;
    });
  }
  return facePromise;
}

/** TensorFlow.js COCO-SSD object detector (includes the "cell phone" class). */
export function loadObjectDetector(): Promise<ObjectDetection> {
  if (!objectPromise) {
    objectPromise = (async () => {
      await import("@tensorflow/tfjs"); // registers webgl/cpu backend
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      return cocoSsd.load({ base: "lite_mobilenet_v2" }); // fastest variant
    })().catch((err) => {
      objectPromise = null;
      throw err;
    });
  }
  return objectPromise;
}
