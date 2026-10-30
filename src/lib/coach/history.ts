/* Local-first persistence for the AI Coach (history + progress). */

import type { CoachProgress, SessionRecord } from "@/types/coach";
import { emptyProgress } from "./rewards";

export const HISTORY_KEY = "studybro.coach.history.v1";
export const PROGRESS_KEY = "studybro.coach.progress.v1";
const MAX_SESSIONS = 60;

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as SessionRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(list: SessionRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_SESSIONS)));
  } catch {
    /* storage blocked */
  }
}

export function upsertSession(list: SessionRecord[], rec: SessionRecord): SessionRecord[] {
  return [rec, ...list.filter((r) => r.id !== rec.id)].slice(0, MAX_SESSIONS);
}

export function loadProgress(): CoachProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? { ...emptyProgress(), ...(JSON.parse(raw) as Partial<CoachProgress>) } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: CoachProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked */
  }
}
