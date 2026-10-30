# StudyBro AI — Expo Accuracy Guide

This release is tuned for live exhibition use, where false alerts are worse than a slightly slower confirmation.

## What was corrected from the supplied recording

The recording showed four stability problems:

1. **Eye/drowsiness state changed too easily.** A single fixed EAR threshold did not fit the user's natural eye shape and became less reliable when the head moved.
2. **Head turning could create two problems at once.** A deliberate left/right distraction test could also be interpreted as poor posture.
3. **Face tracking briefly dropped while the student was still visible.** The UI could flash `FACE NOT DETECTED` on a short MediaPipe miss.
4. **Object detection accepted a broad `remote` class.** That increased the chance of a non-phone object being treated as phone evidence.

## New live accuracy pipeline

### 1. Personal 3.2-second calibration

When monitoring starts, StudyBro first learns the student's neutral:

- open-eye EAR baseline
- neutral head yaw/pitch
- normal face center
- normal face size / study distance

No behavioral alert can fire during calibration.

### 2. Adaptive drowsiness detection

The eye-closed threshold is now calculated from the student's own open-eye baseline instead of a single fixed number. Recent EAR measurements are median-smoothed, both eyes must agree, and drowsiness is suspended during strong head rotation where eye geometry is unreliable.

Default confirmed drowsiness: **about 5.2 seconds of stable closure**.

### 3. Relative head-pose distraction

Head pose is measured relative to the student's calibrated neutral position. A clear side turn is treated as distraction; normal small movements are ignored. Looking down is intentionally less sensitive because students naturally glance at books and keyboards.

Default confirmed distraction: **about 3.2 seconds**.

### 4. Posture and distraction are separated

A deliberate head turn no longer counts as bad posture. Posture is based mainly on sustained movement from the calibrated face position / distance, and is suspended while a stronger phone, drowsiness, or distraction signal is active.

Default confirmed posture issue: **about 4.5 seconds**.

### 5. Phone evidence requires repeated detections

StudyBro now requires repeated high-confidence cell-phone detections before starting the phone timer. The generic `remote` class was removed. A single object-detector mistake cannot trigger the phone intervention.

Default confirmed phone use: **about 2–2.5 seconds in normal conditions**.

### 6. Face-tracking anti-flicker

A very short MediaPipe miss reuses the last reliable face track instead of immediately flashing `FACE NOT DETECTED`. Presence / away still requires sustained real face loss.

Default away confirmation: **about 6 seconds**.

### 7. Detector priority

Specific signals have priority so the system does not stack contradictory alerts:

`AWAY / PHONE / DROWSINESS` → then `DISTRACTION` → then `POSTURE`

For example, looking at a phone should produce a phone intervention rather than phone + distraction + posture at the same time.

## How to demo it at the expo

1. Start Monitoring.
2. Stay upright, face the screen, and keep your eyes open while the **Calibration** bar reaches 100%.
3. Test one behavior at a time and return to neutral before testing the next behavior.
4. If the chair, webcam, or laptop position changes, press **Recalibrate**.

Recommended live demo order:

- Normal focus — show green stable tracking.
- Turn clearly left/right for ~4 seconds — one distraction event.
- Return to center for ~1 second.
- Show a phone clearly for ~3 seconds — one phone event.
- Remove phone and wait for recovery.
- Close both eyes while facing mostly forward for ~6 seconds — one drowsiness event.
- Open eyes — intervention should close after recovery is confirmed.

## Important presentation note

No webcam-only system can guarantee 100% classification under every lighting, occlusion, camera angle, or device. This release is intentionally tuned to reduce false positives and conflicting alerts during a controlled expo demonstration. Good front lighting and a camera near eye level materially improve the result.
