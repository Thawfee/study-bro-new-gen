# StudyBro AI — your AI study coach

StudyBro is a local-first study app. It runs focus sessions with **on-device computer vision**
(drowsiness, phone, look-aways, posture, presence), steps in **only as much as needed**, turns
interventions into **revision**, predicts **fatigue** before you crash, and ends every session with a
**report**. No account, no server, nothing recorded or uploaded.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000  (Chrome or Edge)
```

For the expo (faster, more stable):

```bash
npm run build
npm run start
```

Internet is needed only the first time the camera starts (the AI models download once, then they're cached).
Fonts are self-hosted, so the app itself builds and runs offline.

## How a session works

1. **Plan** — pick a task, a length (25 / 50 / 90 / custom / no limit) and camera on/off.
2. **Study** — StudyBro escalates gently:

| Situation | Response |
|---|---|
| Look away / slouch | soft **nudge** + chime |
| 2nd look-away within 3 min | **Recall Check** — one question from your notes |
| Eyes closed ~5s | **wake alarm** (stops by itself when eyes open) → Recall Check |
| Phone in view | **phone-down alarm** (stops by itself when the phone is gone) |
| Leave the desk | timer **auto-pauses**, resumes when you're back |
| Switch to another tab 8s+ | counted as a digital distraction, nudge on return |
| Brow furrowed ~7s (experimental) | "Stuck?" → save a doubt to Tasks / open notes |
| Fatigue risk ≥ 70% | **smart break** suggestion (breathing timer, no penalties) |

3. **Report** — grade, focus %, what pulled you away, recall accuracy, XP and personal tips.

The camera keeps working while you open Notes or Tasks (floating mini preview) and turns off when the session ends.
All alert sounds are synthesised with WebAudio — there are no video or audio files.

## Pages

| Page | What it's for |
|---|---|
| `/dashboard` Home | today's numbers, this week, up-next tasks, due cards, coach tip, goals |
| `/focus` Focus Session | plan → live session (timer, camera, signals, timeline, coach) |
| `/review` Review | flashcards with spaced repetition (from `Q:`/`A:` lines in notes) |
| `/tasks`, `/goals`, `/notes` | planning and notes |
| `/analytics` Insights | daily minutes, focus %, distractions, best hours, session history |
| `/achievements` | level, XP, badges, milestones |
| `/settings` | sessions, alerts & sound, AI coach, camera sensitivity, export/delete data |
| `/expo` | full-screen showcase + scripted judge walkthrough (clearly labelled simulation) |
| `/lab` | enter your own trials to measure detection accuracy |

Installable as an app (PWA): "Install" in Chrome/Edge, or "Add to Home Screen" on a phone.

## How the AI parts work (all explainable)

- **Vision** — MediaPipe Face Landmarker (eyes, head pose, blendshapes) + TensorFlow.js COCO-SSD (phone),
  with a 3-second personal calibration, adaptive eye threshold, multi-frame phone evidence and debouncing.
  See `src/hooks/useVisionEngine.ts` and `src/lib/ai/vision/visionConfig.ts`.
- **Recall Check** — `src/lib/coach/quiz.ts`: due flashcards first, then fill-in-the-blank from notes,
  then "which note is this from?", then a mental-maths fallback. Fully offline.
- **Fatigue prediction** — `src/lib/coach/fatigue.ts`: transparent points for time on task vs. your
  personal focus window (median minutes to first lapse), recent lapses, eyes closing, low score and weak hours.
- **Spaced repetition** — `src/lib/coach/cards.ts`: Leitner boxes (1, 2, 4, 7, 15 days; missed → 10 min).
- **Session report** — `src/lib/coach/summary.ts`: grade + rule-based tips, each traceable to a number.

These are behavioural cues, not medical or psychological measurements. No accuracy numbers are invented —
use `/lab` to measure your own.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Recharts · MediaPipe Tasks Vision · TensorFlow.js / COCO-SSD · WebAudio.
Data lives in `localStorage` (`studybro.*` keys); Settings → Your data exports it as JSON.
