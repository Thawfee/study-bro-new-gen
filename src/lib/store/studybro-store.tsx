"use client";

/* ============================================================
   StudyBroStore — the central brain.

   Session lifecycle:  idle → running ⇄ paused → summary → idle

   • Detection logic lives in lib/ai (+ the live vision engine)
   • Anti-spam gating lives in lib/alerts
   • Coach logic (quiz, fatigue, rewards, report) lives in lib/coach
   This store wires them together and runs a 1s engine tick.
   ============================================================ */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import type { DetectionSnapshot, DetectionType, FocusState } from "@/types/ai";
import type { AlertEvent, AlertSettings, Intervention, ToastMessage } from "@/types/alerts";
import type {
  PauseReason,
  RecoveryRecord,
  SessionPhase,
  SessionPlan,
  SessionSummary,
  StudySession,
} from "@/types/session";
import { emptyMetrics } from "@/types/session";
import type {
  BreakState,
  BreakSuggestion,
  Celebration,
  CoachProgress,
  ConfusionState,
  FatigueEstimate,
  HelpPrompt,
  Lapse,
  QuizQuestion,
  SessionRecord,
  StreakState,
} from "@/types/coach";

import { normalDrowsiness } from "@/lib/ai/drowsiness";
import { normalPhone } from "@/lib/ai/phone";
import { normalGaze } from "@/lib/ai/gaze";
import { normalPosture } from "@/lib/ai/posture";
import { normalPresence } from "@/lib/ai/presence";
import { clampScore, deductionFor, FACTOR_LABELS, focusStatusFromScore } from "@/lib/ai/focus-engine";
import { simulateDetection, type AIExplanation, type DemoDetectionOutput } from "@/lib/ai/demo-engine";
import { evaluateAlert, type CooldownMap } from "@/lib/alerts/alertManager";
import {
  DEFAULT_SETTINGS,
  DISTRACTION_ESCALATE_MS,
  INTERVENTION_COPY,
  NUDGE_COPY,
  TAB_LAPSE_MS,
} from "@/lib/alerts/interventions";
import { uid } from "@/lib/utils";
import { useWorkspace } from "@/lib/store/workspace-store";
import { generateQuiz } from "@/lib/coach/quiz";
import { cardStore, deriveCards, dueIds } from "@/lib/coach/cards";
import { estimateFatigue } from "@/lib/coach/fatigue";
import { buildSummary, countLapses } from "@/lib/coach/summary";
import {
  emptyProgress,
  FAST_RECOVERY_MS,
  localDate,
  newlyEarned,
  STREAK_MILESTONES,
  XP,
} from "@/lib/coach/rewards";
import { loadHistory, loadProgress, saveHistory, saveProgress, upsertSession } from "@/lib/coach/history";

const RECOVERY_MS = 7000; // demo: how long a simulated state lingers
const DEMO_AWAY_MS = 5000; // demo: auto-return after "away"
const MAX_EVENTS = 80;
const SETTINGS_KEY = "studybro.settings.v3";
const HELP_COOLDOWN_MS = 90_000;
const BREAK_SUGGEST_COOLDOWN_MS = 8 * 60_000;
/** Lapses that end a deep-focus streak (posture alone does not). */
const STREAK_BREAKERS: (DetectionType | "tab")[] = ["drowsiness", "phone", "distraction", "away", "tab"];
/** Lapses that count towards the personal focus window. */
const WINDOW_LAPSES: (DetectionType | "tab")[] = ["drowsiness", "phone", "distraction", "tab"];

/* ------------------------------- State -------------------------------- */

/** "demo" = simulated triggers. "live" = real in-browser AI is driving detections. */
export type EngineMode = "demo" | "live";

interface StoreState {
  /* session */
  phase: SessionPhase;
  plan: SessionPlan | null;
  pauseReason: PauseReason | null;
  pausedAt: number | null;
  summary: SessionSummary | null;
  tabHiddenSince: number | null;
  xpAtStart: number;

  mode: EngineMode;
  now: number;
  detections: DetectionSnapshot;
  focus: FocusState;
  events: AlertEvent[];
  toasts: ToastMessage[];
  intervention: Intervention | null;
  explanation: AIExplanation | null;
  settings: AlertSettings;
  settingsHydrated: boolean;
  session: StudySession;
  recoveries: RecoveryRecord[];
  cooldowns: CooldownMap;

  /* AI coach */
  confusion: ConfusionState;
  helpPrompt: HelpPrompt | null;
  lastHelpAt: number;
  breakState: BreakState | null;
  blockStartedAt: number;
  breakSuggestion: BreakSuggestion | null;
  lastBreakSuggestAt: number;
  fatigue: FatigueEstimate;
  lapses: Lapse[];
  firstLapseMinutes: number[];
  blockHadLiveLapse: boolean;
  streak: StreakState;
  sessionQuiz: { correct: number; total: number };
  sessionBreaks: number;
  recentQuizIds: string[];
  progress: CoachProgress;
  history: SessionRecord[];
  coachHydrated: boolean;
  celebrations: Celebration[];
}

function freshDetections(): DetectionSnapshot {
  return {
    drowsiness: normalDrowsiness(),
    phone: normalPhone(),
    gaze: normalGaze(),
    posture: normalPosture(),
    presence: normalPresence(),
  };
}

function freshFocus(): FocusState {
  return { score: 100, status: "Focused", factors: [] };
}

function freshFatigue(): FatigueEstimate {
  return {
    risk: 0, level: "FRESH", reasons: [], blockMinutes: 0, windowMinutes: 45,
    windowPersonal: false, windowSamples: 0, minutesToBreak: 45,
  };
}

function freshStreak(): StreakState {
  return { currentMs: 0, sessionBestMs: 0, milestonesHit: [] };
}

/** Everything that belongs to one session (reset on start). */
function freshSessionSlice() {
  return {
    pauseReason: null as PauseReason | null,
    pausedAt: null as number | null,
    tabHiddenSince: null as number | null,
    detections: freshDetections(),
    focus: freshFocus(),
    toasts: [] as ToastMessage[],
    intervention: null as Intervention | null,
    explanation: null as AIExplanation | null,
    cooldowns: {} as CooldownMap,
    helpPrompt: null as HelpPrompt | null,
    breakState: null as BreakState | null,
    breakSuggestion: null as BreakSuggestion | null,
    lastBreakSuggestAt: 0,
    fatigue: freshFatigue(),
    lapses: [] as Lapse[],
    firstLapseMinutes: [] as number[],
    blockHadLiveLapse: false,
    streak: freshStreak(),
    sessionQuiz: { correct: 0, total: 0 },
    sessionBreaks: 0,
  };
}

function initialState(): StoreState {
  return {
    ...freshSessionSlice(),
    phase: "idle",
    plan: null,
    summary: null,
    xpAtStart: 0,
    mode: "demo",
    now: 0,
    events: [],
    settings: DEFAULT_SETTINGS,
    settingsHydrated: false,
    session: { startedAt: null, metrics: emptyMetrics() },
    recoveries: [],
    confusion: { status: "CLEAR", level: 0 },
    lastHelpAt: 0,
    blockStartedAt: 0,
    recentQuizIds: [],
    progress: emptyProgress(),
    history: [],
    coachHydrated: false,
    celebrations: [],
  };
}

/* ------------------------------ Actions ------------------------------- */

type Action =
  | { kind: "START"; plan: SessionPlan; now: number }
  | { kind: "PAUSE"; now: number; reason: PauseReason }
  | { kind: "RESUME"; now: number }
  | { kind: "END"; now: number }
  | { kind: "CLOSE_SUMMARY" }
  | { kind: "TRIGGER"; type: DetectionType; now: number; quiz: QuizQuestion | null }
  | { kind: "INGEST"; output: DemoDetectionOutput; now: number; quiz: QuizQuestion | null }
  | { kind: "LIVE_UPDATE"; patch: Partial<DetectionSnapshot>; now: number; confusion?: ConfusionState }
  | { kind: "PUSH_EVENT"; icon: string; message: string; now: number }
  | { kind: "SET_MODE"; mode: EngineMode }
  | { kind: "TICK"; now: number; dt: number }
  | { kind: "TAB_HIDDEN"; now: number }
  | { kind: "TAB_VISIBLE"; now: number }
  | { kind: "RESOLVE_INTERVENTION"; now: number }
  | { kind: "ANSWER_QUIZ"; choice: number; now: number }
  | { kind: "DISMISS_TOAST"; id: string }
  | { kind: "UPDATE_SETTINGS"; patch: Partial<AlertSettings> }
  | { kind: "HYDRATE_SETTINGS"; settings: AlertSettings }
  | { kind: "CONFUSION_EPISODE"; now: number; source: "live" | "demo" }
  | { kind: "RESOLVE_HELP"; now: number; outcome: "doubt" | "notes" | "dismiss" }
  | { kind: "START_BREAK"; now: number }
  | { kind: "END_BREAK"; now: number }
  | { kind: "SUGGEST_BREAK"; now: number }
  | { kind: "DISMISS_BREAK_SUGGESTION"; now: number }
  | { kind: "DISMISS_CELEBRATION"; id: string }
  | { kind: "CARD_REVIEWED"; now: number; correct: boolean }
  | { kind: "HYDRATE_COACH"; history: SessionRecord[]; progress: CoachProgress };

/* ------------------------------ Helpers ------------------------------- */

function pushEvent(events: AlertEvent[], ev: AlertEvent): AlertEvent[] {
  return [ev, ...events].slice(0, MAX_EVENTS);
}

function sysEvent(events: AlertEvent[], icon: string, message: string, now: number): AlertEvent[] {
  return pushEvent(events, { id: uid("ev"), type: "system", icon, message, severity: "normal", timestamp: now });
}

function nudge(toasts: ToastMessage[], t: Omit<ToastMessage, "id" | "createdAt">, now: number): ToastMessage[] {
  return [{ ...t, id: uid("t"), createdAt: now }, ...toasts].slice(0, 3);
}

function isActive(lastDetected: number | null, now: number): boolean {
  return lastDetected != null && now - lastDetected < RECOVERY_MS;
}

/** Whether the live snapshot still supports the condition behind an intervention. */
function liveConditionActive(type: DetectionType, d: DetectionSnapshot): boolean {
  switch (type) {
    case "phone":
      return d.phone.status === "DETECTED";
    case "drowsiness":
      return d.drowsiness.status === "CRITICAL" || d.drowsiness.eyeState === "closed";
    case "distraction":
      return d.gaze.status === "DISTRACTED";
    case "posture":
      return d.posture.status !== "GOOD";
    case "away":
      return d.presence.status === "AWAY";
  }
}

function applyFactor(focus: FocusState, type: DetectionType | "reward" | "tab", label: string, delta: number, now: number): FocusState {
  if (delta === 0) return focus;
  const score = clampScore(focus.score + delta);
  const factor = { id: uid("f"), type, label, delta, timestamp: now };
  return { score, status: focusStatusFromScore(score), factors: [factor, ...focus.factors].slice(0, 12) };
}

/** Grant XP and queue a celebration card. */
function celebrate(s: StoreState, icon: string, title: string, detail: string, xp: number, now: number): StoreState {
  return {
    ...s,
    progress: { ...s.progress, xp: s.progress.xp + xp },
    celebrations: [...s.celebrations, { id: uid("cel"), icon, title, detail, xp, createdAt: now }].slice(-4),
  };
}

/** Unlock any badge whose condition is now met. */
function awardBadges(s: StoreState, now: number): StoreState {
  if (!s.coachHydrated) return s;
  let next = s;
  for (const b of newlyEarned(s.progress)) {
    next = { ...next, progress: { ...next.progress, badges: [...next.progress.badges, b.id] } };
    next = celebrate(next, b.icon, `Badge unlocked: ${b.title}`, b.description, XP.badge, now);
    next = { ...next, events: sysEvent(next.events, "🏅", `Badge unlocked: ${b.title} (+${XP.badge} XP)`, now) };
  }
  return next;
}

function avgRecovery(s: StoreState): number | null {
  const start = s.session.startedAt ?? 0;
  const recs = s.recoveries.filter((r) => r.recoveredAt >= start);
  return recs.length ? recs.reduce((a, r) => a + r.durationMs, 0) / recs.length : null;
}

/** Snapshot the current session into local history (used for prediction + insights). */
function recordSession(s: StoreState, now: number, final = false): SessionRecord[] {
  if (s.session.startedAt == null || !s.plan) return s.history;
  const start = s.session.startedAt;
  const counts = countLapses(s.lapses);
  const rec: SessionRecord = {
    id: start,
    date: localDate(start),
    hour: new Date(start).getHours(),
    studyMs: s.session.metrics.studyTimeMs,
    focusedMs: s.session.metrics.focusedTimeMs,
    firstLapseMinutes: s.firstLapseMinutes,
    lapses: s.lapses.filter((l) => l.live).length,
    quizCorrect: s.sessionQuiz.correct,
    quizTotal: s.sessionQuiz.total,
    breaks: s.sessionBreaks,
    bestStreakMs: s.streak.sessionBestMs,
    task: s.plan.task,
    subject: s.plan.subject,
    plannedMin: s.plan.durationMin,
    score: s.focus.score,
    completed: final && s.plan.durationMin != null && s.session.metrics.studyTimeMs >= s.plan.durationMin * 60_000 - 1000,
    endedAt: final ? now : undefined,
    tabSwitches: s.session.metrics.tabSwitches,
    avgRecoveryMs: avgRecovery(s),
    lapseCounts: counts,
    demo: s.plan.demo,
  };
  return upsertSession(s.history, rec);
}

function startSession(state: StoreState, plan: SessionPlan, now: number): StoreState {
  return {
    ...state,
    ...freshSessionSlice(),
    phase: "running",
    plan,
    summary: null,
    xpAtStart: state.progress.xp,
    now,
    blockStartedAt: now,
    lastBreakSuggestAt: now,
    session: { startedAt: now, metrics: emptyMetrics() },
    events: sysEvent([], "🟢", `Session started${plan.task ? ` — ${plan.task}` : ""}`, now),
  };
}

function pause(s: StoreState, reason: PauseReason, now: number): StoreState {
  if (s.phase !== "running") return s;
  return { ...s, phase: "paused", pauseReason: reason, pausedAt: now };
}

function resume(s: StoreState, now: number): StoreState {
  if (s.phase !== "paused") return s;
  const pausedMs = s.pausedAt ? now - s.pausedAt : 0;
  return {
    ...s,
    phase: "running",
    pauseReason: null,
    pausedAt: null,
    session: { ...s.session, metrics: { ...s.session.metrics, pausedMs: s.session.metrics.pausedMs + pausedMs } },
  };
}

function endBreak(s: StoreState, now: number): StoreState {
  const resumed = resume({ ...s, breakState: null }, now);
  return {
    ...resumed,
    now,
    blockStartedAt: now,
    blockHadLiveLapse: false,
    lastBreakSuggestAt: now,
    events: sysEvent(s.events, "⚡", "Break over — fresh focus block started", now),
  };
}

function finishSession(state: StoreState, now: number): StoreState {
  if (!state.plan || state.session.startedAt == null || (state.phase !== "running" && state.phase !== "paused")) return state;
  // Close any open pause so paused time is accounted for.
  let s = state.phase === "paused" ? resume({ ...state, breakState: null }, now) : state;
  const m = s.session.metrics;
  const completedPlan = s.plan!.durationMin != null && m.studyTimeMs >= s.plan!.durationMin * 60_000 - 1000;

  if (m.studyTimeMs >= 5 * 60_000) {
    s = { ...s, progress: { ...s.progress, sessionsCompleted: s.progress.sessionsCompleted + (completedPlan ? 1 : 0) } };
    const xp = XP.sessionComplete + (completedPlan ? XP.plannedBonus : 0);
    s = celebrate(s, "🏁", completedPlan ? "Planned session complete" : "Session saved", `${Math.round(m.studyTimeMs / 60_000)} focused-session minutes logged`, xp, now);
  }
  s = awardBadges(s, now);
  const history = m.studyTimeMs >= 60_000 ? recordSession(s, now, true) : s.history;

  const summary = buildSummary({
    plan: s.plan!,
    startedAt: s.session.startedAt!,
    endedAt: now,
    metrics: s.session.metrics,
    score: s.focus.score,
    lapses: s.lapses,
    quiz: s.sessionQuiz,
    bestStreakMs: s.streak.sessionBestMs,
    breaks: s.sessionBreaks,
    recoveries: s.recoveries,
    xpEarned: s.progress.xp - s.xpAtStart,
    history: s.history,
  });

  return {
    ...s,
    history,
    phase: "summary",
    summary,
    pauseReason: null,
    pausedAt: null,
    intervention: null,
    breakState: null,
    breakSuggestion: null,
    helpPrompt: null,
    tabHiddenSince: null,
    now,
    events: sysEvent(s.events, "🏁", "Session ended", now),
  };
}

/** Log a lapse: lapse list, personal focus-window sample, streak reset. */
function logLapse(s: StoreState, type: DetectionType | "tab", now: number): StoreState {
  const live = s.mode === "live" || type === "tab";
  const lapses = [...s.lapses, { at: now, type, live }].slice(-120);
  let firstLapseMinutes = s.firstLapseMinutes;
  let blockHadLiveLapse = s.blockHadLiveLapse;
  if (live && !blockHadLiveLapse && WINDOW_LAPSES.includes(type) && s.blockStartedAt) {
    firstLapseMinutes = [...firstLapseMinutes, Math.round(((now - s.blockStartedAt) / 60_000) * 10) / 10];
    blockHadLiveLapse = true;
  }
  const streak = STREAK_BREAKERS.includes(type) ? { ...s.streak, currentMs: 0, milestonesHit: [] } : s.streak;
  return { ...s, lapses, firstLapseMinutes, blockHadLiveLapse, streak };
}

/**
 * The single detection-episode pipeline shared by demo triggers and the live
 * vision engine: score → timeline → explanation → escalation ladder.
 */
function applyEpisode(state: StoreState, output: DemoDetectionOutput, now: number, quiz: QuizQuestion | null): StoreState {
  if (state.phase !== "running") return state;
  const { type } = output;
  let s: StoreState = {
    ...state,
    now,
    detections: { ...state.detections, ...output.patch },
    focus: applyFactor(state.focus, type, FACTOR_LABELS[type], deductionFor(type), now),
    events: pushEvent(state.events, {
      id: uid("ev"),
      type,
      icon: output.event.icon,
      message: output.event.message,
      severity: output.event.severity,
      timestamp: now,
    }),
    explanation: output.explanation,
  };
  const recentDistractions = s.lapses.filter((l) => l.type === "distraction" && now - l.at < DISTRACTION_ESCALATE_MS).length;
  s = logLapse(s, type, now);

  // ---- away: pause instead of alarming ----
  if (type === "away") {
    if (!s.settings.autoPauseAway) return s;
    const c = NUDGE_COPY.away;
    s = pause(s, "away", now);
    return { ...s, toasts: nudge(s.toasts, { type, icon: c.icon, title: c.title, message: c.message, severity: "warning", sound: true }, now) };
  }

  // ---- soft nudges ----
  const escalateDistraction = type === "distraction" && recentDistractions >= 1 && quiz != null && s.settings.quizInterventions;
  if (type === "posture" || (type === "distraction" && !escalateDistraction)) {
    const c = NUDGE_COPY[type];
    const detail = type === "posture" && s.detections.posture.reason ? `${s.detections.posture.reason} — sit back and lift your head.` : c.message;
    return { ...s, toasts: nudge(s.toasts, { type, icon: c.icon, title: c.title, message: detail, severity: "warning", sound: true }, now) };
  }

  // ---- blocking interventions (drowsiness, phone, escalated distraction) ----
  const decision = evaluateAlert({ type, now, settings: s.settings, alertOpen: s.intervention != null, cooldowns: s.cooldowns });
  if (decision.fire !== true) {
    return {
      ...s,
      toasts: nudge(s.toasts, {
        type,
        icon: output.event.icon,
        title: output.event.message,
        message: decision.reason === "cooldown" ? "Stay with it — you got this." : decision.reason === "already-open" ? "Finish the current check first." : "Interventions are off in Settings.",
        severity: output.event.severity,
        sound: true,
      }, now),
    };
  }

  let intervention: Intervention;
  if (type === "phone") {
    intervention = { id: uid("iv"), type, kind: "phone", ...INTERVENTION_COPY.phone, createdAt: now, conditionClearedAt: null, quizAnswered: false };
  } else if (quiz && s.settings.quizInterventions) {
    const copy = type === "drowsiness" ? INTERVENTION_COPY.wakeQuiz : INTERVENTION_COPY.focusQuiz;
    intervention = { id: uid("iv"), type, kind: "quiz", ...copy, quiz, createdAt: now, conditionClearedAt: null, quizAnswered: false };
  } else {
    intervention = { id: uid("iv"), type, kind: "wake", ...INTERVENTION_COPY.wake, createdAt: now, conditionClearedAt: null, quizAnswered: false };
  }
  return { ...s, intervention, cooldowns: { ...s.cooldowns, [type]: now } };
}

/** Close a non-quiz intervention and record the measured recovery. */
function recoverIntervention(s: StoreState, now: number): StoreState {
  const iv = s.intervention;
  if (!iv) return s;
  const durationMs = Math.max(0, now - iv.createdAt);
  const label = iv.type === "phone" ? "Phone put away" : iv.type === "drowsiness" ? "Eyes open again" : "Back on task";
  let next: StoreState = {
    ...s,
    intervention: null,
    recoveries: [{ id: uid("rec"), type: iv.type, startedAt: iv.createdAt, recoveredAt: now, durationMs }, ...s.recoveries].slice(0, 40),
    events: sysEvent(s.events, "✅", `${label} — recovered in ${Math.max(1, Math.round(durationMs / 1000))}s`, now),
  };
  if (durationMs < FAST_RECOVERY_MS) {
    next = { ...next, progress: { ...next.progress, fastRecoveries: next.progress.fastRecoveries + 1 } };
    next = celebrate(next, "⚡", "Bounce back!", `Recovered in ${Math.max(1, Math.round(durationMs / 1000))}s`, XP.fastRecovery, now);
    next = awardBadges(next, now);
  }
  return next;
}

/* ------------------------------ Reducer ------------------------------- */

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.kind) {
    case "START":
      return startSession(state, action.plan, action.now);

    case "PAUSE": {
      const s = pause(state, action.reason, action.now);
      return s === state ? s : { ...s, events: sysEvent(s.events, "⏸️", "Session paused", action.now) };
    }

    case "RESUME": {
      if (state.phase !== "paused" || state.breakState) return state;
      const s = resume(state, action.now);
      return { ...s, events: sysEvent(s.events, "▶️", "Session resumed", action.now) };
    }

    case "END":
      return finishSession(state, action.now);

    case "CLOSE_SUMMARY":
      return { ...state, phase: "idle", summary: null, plan: null, session: { startedAt: null, metrics: emptyMetrics() } };

    case "TRIGGER": {
      // Demo trigger from idle starts a clearly-labelled demo session first.
      let s = state;
      if (s.phase === "idle" || s.phase === "summary") {
        s = startSession(s, { task: "Demo session", taskId: null, subject: "Demo", durationMin: null, camera: false, demo: true }, action.now);
      }
      if (s.phase === "paused" && s.pauseReason !== "break") s = resume(s, action.now);
      return applyEpisode(s, simulateDetection(action.type, action.now), action.now, action.quiz);
    }

    case "INGEST":
      return applyEpisode(state, action.output, action.now, action.quiz);

    case "LIVE_UPDATE": {
      const detections = { ...state.detections, ...action.patch };
      let s: StoreState = { ...state, now: action.now, detections, confusion: action.confusion ?? state.confusion };
      const iv = s.intervention;

      if (s.mode === "live" && iv) {
        const active = liveConditionActive(iv.type, detections);
        if (iv.kind === "quiz") {
          // The question waits for an answer; only the wake phase tracks the condition.
          if (!active && iv.conditionClearedAt == null) s = { ...s, intervention: { ...iv, conditionClearedAt: action.now } };
          else if (active && iv.conditionClearedAt != null && !iv.quizAnswered && iv.type === "drowsiness") {
            s = { ...s, intervention: { ...iv, conditionClearedAt: null } };
          }
        } else if (!active) {
          s = recoverIntervention(s, action.now);
        }
      }

      // Auto-resume when the student returns to the desk.
      if (s.phase === "paused" && s.pauseReason === "away" && detections.presence.status === "PRESENT") {
        const awaySec = s.pausedAt ? Math.round((action.now - s.pausedAt) / 1000) : 0;
        s = resume(s, action.now);
        s = { ...s, events: sysEvent(s.events, "👋", `Welcome back — session resumed (away ${awaySec}s)`, action.now) };
      }
      return s;
    }

    case "PUSH_EVENT":
      return { ...state, events: sysEvent(state.events, action.icon, action.message, action.now) };

    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "TICK": {
      const { now, dt } = action;
      if (state.breakState) {
        return now >= state.breakState.endsAt ? endBreak(state, now) : { ...state, now };
      }
      if (state.phase === "paused") {
        // Demo "away" returns by itself so the demo flow keeps moving.
        if (state.pauseReason === "away" && state.mode === "demo" && state.pausedAt && now - state.pausedAt > DEMO_AWAY_MS) {
          const s = resume({ ...state, detections: { ...state.detections, presence: normalPresence() } }, now);
          return { ...s, now, events: sysEvent(s.events, "👋", "Welcome back — session resumed", now) };
        }
        return { ...state, now };
      }
      if (state.phase !== "running" || state.session.startedAt == null) return { ...state, now };

      const d = state.detections;
      const detections: DetectionSnapshot = { ...d };
      if (state.mode === "demo") {
        if (d.drowsiness.lastDetected && !isActive(d.drowsiness.lastDetected, now)) detections.drowsiness = normalDrowsiness();
        if (d.phone.lastDetected && !isActive(d.phone.lastDetected, now)) detections.phone = normalPhone();
        if (d.gaze.lastDetected && !isActive(d.gaze.lastDetected, now)) detections.gaze = normalGaze();
        if (d.posture.lastDetected && !isActive(d.posture.lastDetected, now)) detections.posture = normalPosture();
        if (d.presence.status === "AWAY") detections.presence = normalPresence();
      }

      const drowsyActive = isActive(detections.drowsiness.lastDetected, now) && detections.drowsiness.status !== "NORMAL";
      const phoneActive = detections.phone.status === "DETECTED";
      const gazeActive = detections.gaze.status === "DISTRACTED";
      const awayActive = detections.presence.status === "AWAY";
      const postureBad = detections.posture.status === "BAD";
      const tabAway = state.tabHiddenSince != null && now - state.tabHiddenSince > TAB_LAPSE_MS;
      const anyProblem = drowsyActive || phoneActive || gazeActive || awayActive || !!state.intervention || tabAway;

      const m = { ...state.session.metrics };
      m.studyTimeMs += dt;
      if (drowsyActive) m.drowsinessMs += dt;
      if (phoneActive) m.phoneUsageMs += dt;
      if (gazeActive) m.distractionTimeMs += dt;
      if (awayActive) m.awayMs += dt;
      if (!anyProblem) m.focusedTimeMs += dt;
      m.postureScore = postureBad ? Math.max(40, m.postureScore - (dt / 1000) * 3) : Math.min(100, m.postureScore + (dt / 1000) * 1);

      let next: StoreState = { ...state, now, detections, session: { ...state.session, metrics: m } };

      // --- deep-focus streak ---
      if (!anyProblem) {
        const currentMs = next.streak.currentMs + dt;
        next = {
          ...next,
          streak: { ...next.streak, currentMs, sessionBestMs: Math.max(next.streak.sessionBestMs, currentMs) },
          progress: currentMs > next.progress.bestStreakMs ? { ...next.progress, bestStreakMs: currentMs } : next.progress,
        };
        for (const ms of STREAK_MILESTONES) {
          if (currentMs >= ms.minutes * 60_000 && !next.streak.milestonesHit.includes(ms.minutes)) {
            next = { ...next, streak: { ...next.streak, milestonesHit: [...next.streak.milestonesHit, ms.minutes] } };
            next = celebrate(next, "🔥", ms.title, "Uninterrupted focus — keep the chain going", ms.xp, now);
            next = { ...next, focus: applyFactor(next.focus, "reward", ms.title, 2, now), events: sysEvent(next.events, "🔥", `Streak: ${ms.title} (+${ms.xp} XP)`, now) };
          }
        }
      }

      // --- study-day log ---
      const today = localDate(now);
      if (m.focusedTimeMs >= 5 * 60_000 && !next.progress.studyDays.includes(today)) {
        next = { ...next, progress: { ...next.progress, studyDays: [...next.progress.studyDays, today].slice(-180) } };
      }

      // --- fatigue prediction + smart-break suggestion ---
      const fatigue = estimateFatigue({
        now,
        blockStartedAt: next.blockStartedAt || state.session.startedAt,
        lapses: next.lapses,
        eyesClosing: detections.drowsiness.status === "WARNING" || detections.drowsiness.eyeState === "closing",
        focusScore: next.focus.score,
        history: next.history,
        currentSessionId: state.session.startedAt,
      });
      next = { ...next, fatigue };
      if (
        next.settings.smartBreaks && fatigue.level === "BREAK_RECOMMENDED" && !next.breakSuggestion &&
        !next.intervention && now - next.lastBreakSuggestAt > BREAK_SUGGEST_COOLDOWN_MS
      ) {
        next = {
          ...next,
          breakSuggestion: { id: uid("brk"), createdAt: now, risk: fatigue.risk, reasons: fatigue.reasons },
          lastBreakSuggestAt: now,
          events: sysEvent(next.events, "🧘", `Coach: fatigue risk ${fatigue.risk}% — break suggested`, now),
        };
      }

      // --- persist a snapshot once per study minute ---
      if (next.coachHydrated && Math.floor(m.studyTimeMs / 60_000) !== Math.floor(state.session.metrics.studyTimeMs / 60_000)) {
        next = { ...next, history: recordSession(next, now) };
      }

      next = awardBadges(next, now);

      // --- planned duration reached → finish ---
      if (next.plan?.durationMin != null && m.studyTimeMs >= next.plan.durationMin * 60_000 && !next.intervention) {
        return finishSession(next, now);
      }
      return next;
    }

    case "TAB_HIDDEN":
      if (state.phase !== "running" || !state.settings.tabTracking) return state;
      return { ...state, tabHiddenSince: action.now };

    case "TAB_VISIBLE": {
      if (state.tabHiddenSince == null) return state;
      const awayMs = action.now - state.tabHiddenSince;
      let s: StoreState = { ...state, tabHiddenSince: null };
      if (state.phase !== "running" || awayMs < TAB_LAPSE_MS) return s;
      const secs = Math.round(awayMs / 1000);
      s = {
        ...s,
        session: { ...s.session, metrics: { ...s.session.metrics, tabAwayMs: s.session.metrics.tabAwayMs + awayMs, tabSwitches: s.session.metrics.tabSwitches + 1 } },
        focus: applyFactor(s.focus, "tab", "Left the study tab", -5, action.now),
        events: pushEvent(s.events, { id: uid("ev"), type: "tab", icon: "🗂️", message: `Left the study tab for ${secs}s`, severity: "warning", timestamp: action.now }),
        toasts: nudge(s.toasts, { type: "tab", icon: "🗂️", title: "Welcome back to your session", message: `You were on another tab for ${secs}s.`, severity: "warning", sound: true }, action.now),
      };
      return logLapse(s, "tab", action.now);
    }

    case "RESOLVE_INTERVENTION": {
      const iv = state.intervention;
      if (!iv) return state;
      if (iv.kind === "quiz") return { ...state, intervention: null };
      return recoverIntervention(state, action.now);
    }

    case "ANSWER_QUIZ": {
      const iv = state.intervention;
      if (!iv?.quiz || iv.quizAnswered) return state;
      const correct = action.choice === iv.quiz.answerIndex;
      const durationMs = Math.max(0, action.now - iv.createdAt);
      const secs = Math.max(1, Math.round(durationMs / 1000));
      let next: StoreState = {
        ...state,
        intervention: { ...iv, quizAnswered: true },
        recoveries: [{ id: uid("rec"), type: iv.type, startedAt: iv.createdAt, recoveredAt: action.now, durationMs }, ...state.recoveries].slice(0, 40),
        events: sysEvent(state.events, correct ? "🧠" : "📖", correct ? `Recall Check correct — back in ${secs}s` : `Recall Check missed — answer reviewed (${secs}s)`, action.now),
        sessionQuiz: { correct: state.sessionQuiz.correct + (correct ? 1 : 0), total: state.sessionQuiz.total + 1 },
        recentQuizIds: [iv.quiz.id, ...state.recentQuizIds].slice(0, 12),
        progress: {
          ...state.progress,
          quizzesAnswered: state.progress.quizzesAnswered + 1,
          quizzesCorrect: state.progress.quizzesCorrect + (correct ? 1 : 0),
        },
      };
      next = correct
        ? celebrate(next, "🧠", "Recall Check nailed", iv.quiz.sourceTitle ? `From “${iv.quiz.sourceTitle}”` : "Brain back online", XP.quizCorrect, action.now)
        : { ...next, progress: { ...next.progress, xp: next.progress.xp + XP.quizTried } };
      if (correct) next = { ...next, focus: applyFactor(next.focus, "reward", "Recall Check correct", 3, action.now) };
      return awardBadges(next, action.now);
    }

    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "HYDRATE_SETTINGS":
      return { ...state, settings: action.settings, settingsHydrated: true };

    case "CONFUSION_EPISODE": {
      const { now, source } = action;
      if (!state.settings.confusionHelp || state.helpPrompt || state.intervention || state.breakState) return state;
      if (source === "live" && (state.phase !== "running" || now - state.lastHelpAt < HELP_COOLDOWN_MS)) return state;
      return {
        ...state,
        helpPrompt: { id: uid("help"), createdAt: now, source },
        confusion: source === "demo" ? { status: "PUZZLED", level: 0.8 } : state.confusion,
        events: sysEvent(state.events, "🤔", `${source === "demo" ? "Demo: " : ""}Looked stuck — StudyBro offered help`, now),
      };
    }

    case "RESOLVE_HELP": {
      if (!state.helpPrompt) return state;
      const demo = state.helpPrompt.source === "demo";
      let next: StoreState = { ...state, helpPrompt: null, lastHelpAt: action.now, confusion: demo ? { status: "CLEAR", level: 0 } : state.confusion };
      if (action.outcome === "doubt") {
        next = { ...next, progress: { ...next.progress, doubtsLogged: next.progress.doubtsLogged + 1 } };
        next = celebrate(next, "❓", "Doubt saved", "Added to your Tasks — ask it later", XP.doubt, action.now);
        next = { ...next, events: sysEvent(next.events, "❓", "Doubt saved to Tasks", action.now) };
      } else if (action.outcome === "notes") {
        next = { ...next, events: sysEvent(next.events, "📒", "Opened notes to get unstuck", action.now) };
      }
      return awardBadges(next, action.now);
    }

    case "START_BREAK": {
      if (state.breakState || state.intervention || (state.phase !== "running" && state.phase !== "paused")) return state;
      const suggested = state.breakSuggestion != null;
      const minutes = Math.max(1, state.settings.breakMinutes || 5);
      const base = state.phase === "running" ? pause(state, "break", action.now) : { ...state, pauseReason: "break" as PauseReason };
      let next: StoreState = {
        ...base,
        breakState: { startedAt: action.now, endsAt: action.now + minutes * 60_000, suggested },
        breakSuggestion: null,
        helpPrompt: null,
        sessionBreaks: state.sessionBreaks + 1,
        events: sysEvent(state.events, "🧘", `Break — ${minutes} min. Timer paused, no penalties.`, action.now),
      };
      if (suggested) {
        next = { ...next, progress: { ...next.progress, breaksTaken: next.progress.breaksTaken + 1 } };
        next = celebrate(next, "🧘", "Smart break", "Resting before you crash is a skill", XP.smartBreak, action.now);
      }
      return awardBadges(next, action.now);
    }

    case "END_BREAK":
      return state.breakState ? endBreak(state, action.now) : state;

    case "SUGGEST_BREAK": {
      if (state.breakState || state.intervention || state.phase !== "running") return state;
      return {
        ...state,
        breakSuggestion: { id: uid("brk"), createdAt: action.now, risk: state.fatigue.risk, reasons: state.fatigue.reasons },
        lastBreakSuggestAt: action.now,
        events: sysEvent(state.events, "🧘", `Coach: break suggested (fatigue risk ${state.fatigue.risk}%)`, action.now),
      };
    }

    case "DISMISS_BREAK_SUGGESTION":
      return { ...state, breakSuggestion: null, lastBreakSuggestAt: action.now };

    case "DISMISS_CELEBRATION":
      return { ...state, celebrations: state.celebrations.filter((c) => c.id !== action.id) };

    case "CARD_REVIEWED": {
      let next: StoreState = {
        ...state,
        progress: { ...state.progress, cardsReviewed: state.progress.cardsReviewed + 1, xp: state.progress.xp + (action.correct ? XP.cardReview : 0) },
      };
      next = awardBadges(next, action.now);
      return next;
    }

    case "HYDRATE_COACH": {
      const p = action.progress;
      const cur = state.progress;
      return {
        ...state,
        history: action.history,
        coachHydrated: true,
        progress: {
          ...p,
          xp: p.xp + cur.xp,
          quizzesAnswered: p.quizzesAnswered + cur.quizzesAnswered,
          quizzesCorrect: p.quizzesCorrect + cur.quizzesCorrect,
          bestStreakMs: Math.max(p.bestStreakMs, cur.bestStreakMs),
          breaksTaken: p.breaksTaken + cur.breaksTaken,
          doubtsLogged: p.doubtsLogged + cur.doubtsLogged,
          fastRecoveries: p.fastRecoveries + cur.fastRecoveries,
          sessionsCompleted: p.sessionsCompleted + cur.sessionsCompleted,
          cardsReviewed: p.cardsReviewed + cur.cardsReviewed,
          studyDays: [...new Set([...p.studyDays, ...cur.studyDays])],
          badges: [...new Set([...p.badges, ...cur.badges])],
        },
      };
    }

    default:
      return state;
  }
}

/* ------------------------------ Context ------------------------------- */

interface StoreContextValue extends StoreState {
  /* session */
  startSession: (plan: Omit<SessionPlan, "demo"> & { demo?: boolean }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  closeSummary: () => void;

  /* detection pipeline */
  trigger: (type: DetectionType) => void;
  ingest: (output: DemoDetectionOutput) => void;
  liveUpdate: (patch: Partial<DetectionSnapshot>, confusion?: ConfusionState) => void;
  pushSystemEvent: (icon: string, message: string) => void;
  setMode: (mode: EngineMode) => void;

  /* interventions + nudges */
  resolveIntervention: () => void;
  answerQuiz: (choice: number) => void;
  dismissToast: (id: string) => void;
  updateSettings: (patch: Partial<AlertSettings>) => void;

  /* coach */
  reportConfusion: (source: "live" | "demo") => void;
  resolveHelp: (outcome: "doubt" | "notes" | "dismiss") => void;
  startBreak: () => void;
  endBreak: () => void;
  suggestBreak: () => void;
  dismissBreakSuggestion: () => void;
  dismissCelebration: (id: string) => void;
  cardReviewed: (correct: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StudyBroProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const lastTick = useRef<number>(0);
  const started = useRef(false);
  const { notes } = useWorkspace();
  const notesRef = useRef(notes);
  const recentQuizRef = useRef<string[]>([]);
  const interventionRef = useRef<Intervention | null>(null);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { recentQuizRef.current = state.recentQuizIds; }, [state.recentQuizIds]);
  useEffect(() => { interventionRef.current = state.intervention; }, [state.intervention]);

  /** Pre-build a Recall Check (due flashcards first) for episodes that may need one. */
  const quizFor = useCallback((type: DetectionType): QuizQuestion | null => {
    if (type !== "drowsiness" && type !== "distraction") return null;
    const cards = deriveCards(notesRef.current);
    return generateQuiz(notesRef.current, recentQuizRef.current, Math.random, dueIds(cards, cardStore.get()));
  }, []);

  // Hydrate persisted settings + coach data once (client only).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    lastTick.current = Date.now();
    let settings = DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AlertSettings>) };
    } catch {
      /* ignore corrupt/blocked storage */
    }
    dispatch({ kind: "HYDRATE_SETTINGS", settings });
    dispatch({ kind: "HYDRATE_COACH", history: loadHistory(), progress: loadProgress() });
  }, []);

  useEffect(() => {
    if (!state.settingsHydrated) return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch { /* ignore */ }
  }, [state.settings, state.settingsHydrated]);
  useEffect(() => { if (state.coachHydrated) saveProgress(state.progress); }, [state.progress, state.coachHydrated]);
  useEffect(() => { if (state.coachHydrated) saveHistory(state.history); }, [state.history, state.coachHydrated]);

  // Engine tick.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const dt = lastTick.current ? Math.min(5000, now - lastTick.current) : 1000;
      lastTick.current = now;
      dispatch({ kind: "TICK", now, dt });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Digital-distraction tracking: leaving the study tab.
  useEffect(() => {
    const onVis = () => dispatch({ kind: document.hidden ? "TAB_HIDDEN" : "TAB_VISIBLE", now: Date.now() });
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const startSessionCb = useCallback((plan: Omit<SessionPlan, "demo"> & { demo?: boolean }) => {
    lastTick.current = Date.now();
    dispatch({ kind: "START", plan: { demo: false, ...plan }, now: Date.now() });
  }, []);
  const pauseSession = useCallback(() => dispatch({ kind: "PAUSE", now: Date.now(), reason: "manual" }), []);
  const resumeSession = useCallback(() => dispatch({ kind: "RESUME", now: Date.now() }), []);
  const endSession = useCallback(() => dispatch({ kind: "END", now: Date.now() }), []);
  const closeSummary = useCallback(() => dispatch({ kind: "CLOSE_SUMMARY" }), []);

  const trigger = useCallback((type: DetectionType) => {
    dispatch({ kind: "TRIGGER", type, now: Date.now(), quiz: quizFor(type) });
  }, [quizFor]);
  const ingest = useCallback((output: DemoDetectionOutput) => {
    dispatch({ kind: "INGEST", output, now: Date.now(), quiz: quizFor(output.type) });
  }, [quizFor]);
  const liveUpdate = useCallback((patch: Partial<DetectionSnapshot>, confusion?: ConfusionState) => {
    dispatch({ kind: "LIVE_UPDATE", patch, now: Date.now(), confusion });
  }, []);
  const pushSystemEvent = useCallback((icon: string, message: string) => dispatch({ kind: "PUSH_EVENT", icon, message, now: Date.now() }), []);
  const setMode = useCallback((mode: EngineMode) => dispatch({ kind: "SET_MODE", mode }), []);

  const resolveIntervention = useCallback(() => dispatch({ kind: "RESOLVE_INTERVENTION", now: Date.now() }), []);
  const answerQuiz = useCallback((choice: number) => {
    const iv = interventionRef.current;
    // Recall Checks built from flashcards also count as a spaced-repetition review.
    if (iv?.quiz?.kind === "qa" && !iv.quizAnswered) cardStore.review(iv.quiz.id, choice === iv.quiz.answerIndex);
    dispatch({ kind: "ANSWER_QUIZ", choice, now: Date.now() });
  }, []);
  const dismissToast = useCallback((id: string) => dispatch({ kind: "DISMISS_TOAST", id }), []);
  const updateSettings = useCallback((patch: Partial<AlertSettings>) => dispatch({ kind: "UPDATE_SETTINGS", patch }), []);

  const reportConfusion = useCallback((source: "live" | "demo") => dispatch({ kind: "CONFUSION_EPISODE", source, now: Date.now() }), []);
  const resolveHelp = useCallback((outcome: "doubt" | "notes" | "dismiss") => dispatch({ kind: "RESOLVE_HELP", outcome, now: Date.now() }), []);
  const startBreak = useCallback(() => dispatch({ kind: "START_BREAK", now: Date.now() }), []);
  const endBreakCb = useCallback(() => dispatch({ kind: "END_BREAK", now: Date.now() }), []);
  const suggestBreak = useCallback(() => dispatch({ kind: "SUGGEST_BREAK", now: Date.now() }), []);
  const dismissBreakSuggestion = useCallback(() => dispatch({ kind: "DISMISS_BREAK_SUGGESTION", now: Date.now() }), []);
  const dismissCelebration = useCallback((id: string) => dispatch({ kind: "DISMISS_CELEBRATION", id }), []);
  const cardReviewed = useCallback((correct: boolean) => dispatch({ kind: "CARD_REVIEWED", correct, now: Date.now() }), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      startSession: startSessionCb, pauseSession, resumeSession, endSession, closeSummary,
      trigger, ingest, liveUpdate, pushSystemEvent, setMode,
      resolveIntervention, answerQuiz, dismissToast, updateSettings,
      reportConfusion, resolveHelp, startBreak, endBreak: endBreakCb, suggestBreak, dismissBreakSuggestion, dismissCelebration, cardReviewed,
    }),
    [state, startSessionCb, pauseSession, resumeSession, endSession, closeSummary, trigger, ingest, liveUpdate, pushSystemEvent, setMode,
      resolveIntervention, answerQuiz, dismissToast, updateSettings, reportConfusion, resolveHelp, startBreak, endBreakCb, suggestBreak,
      dismissBreakSuggestion, dismissCelebration, cardReviewed],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStudyBro(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStudyBro must be used within <StudyBroProvider>");
  return ctx;
}
