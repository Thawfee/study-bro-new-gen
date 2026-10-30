/* ============================================================
   Flashcards with spaced repetition (Leitner boxes).

   Cards come from `Q: … / A: …` lines inside the student's notes,
   so notes stay the single source of truth. Each card's review
   state (box + due date) is stored locally.

     box 0 → due now     box 3 → 4 days
     box 1 → 1 day       box 4 → 7 days
     box 2 → 2 days      box 5 → 15 days ("mastered")
   ============================================================ */

import { useSyncExternalStore } from "react";
import type { Note } from "@/types/notes";
import { cardId, qaPairs } from "./quiz";

export const CARDS_KEY = "studybro.cards.v1";
const DAY = 864e5;
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 15];
export const MASTERED_BOX = 4;

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  noteId: string;
  noteTitle: string;
}

export interface CardState {
  box: number;
  due: number;
  seen: number;
  correct: number;
  lastReviewed: number;
}

type CardStates = Record<string, CardState>;

export function deriveCards(notes: Note[]): Flashcard[] {
  const seen = new Set<string>();
  const out: Flashcard[] = [];
  for (const p of qaPairs(notes)) {
    const id = cardId(p.q);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, question: p.q, answer: p.a, noteId: p.note.id, noteTitle: p.note.title });
  }
  return out;
}

/* ---------------------- tiny external store ---------------------- */

let states: CardStates = {};
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    states = raw ? (JSON.parse(raw) as CardStates) : {};
  } catch {
    states = {};
  }
}

function emit() {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(states));
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}

const EMPTY: CardStates = {};

export const cardStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get(): CardStates {
    load();
    return states;
  },
  getServer(): CardStates {
    return EMPTY;
  },
  /** Record one review. Correct → next box; missed → back to box 0. */
  review(id: string, correct: boolean, now: number = Date.now()) {
    load();
    const prev = states[id] ?? { box: 0, due: now, seen: 0, correct: 0, lastReviewed: 0 };
    const box = correct ? Math.min(BOX_INTERVAL_DAYS.length - 1, prev.box + 1) : 0;
    // Missed cards come back in 10 minutes; correct ones after the box interval.
    const due = correct ? now + BOX_INTERVAL_DAYS[box] * DAY : now + 10 * 60_000;
    states = {
      ...states,
      [id]: { box, due, seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), lastReviewed: now },
    };
    emit();
  },
  reset() {
    states = {};
    emit();
  },
};

export function useCardStates(): CardStates {
  return useSyncExternalStore(cardStore.subscribe, cardStore.get, cardStore.getServer);
}

export function stateOf(states: CardStates, id: string): CardState {
  return states[id] ?? { box: 0, due: 0, seen: 0, correct: 0, lastReviewed: 0 };
}

export function isDue(states: CardStates, id: string, now: number = Date.now()): boolean {
  return stateOf(states, id).due <= now;
}

export function dueIds(cards: Flashcard[], states: CardStates, now: number = Date.now()): string[] {
  return cards.filter((c) => isDue(states, c.id, now)).map((c) => c.id);
}
