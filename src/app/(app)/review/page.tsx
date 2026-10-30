"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Layers, Plus, RotateCcw, X } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { useStudyBro } from "@/lib/store/studybro-store";
import { BOX_INTERVAL_DAYS, cardStore, deriveCards, isDue, MASTERED_BOX, stateOf, useCardStates, type Flashcard } from "@/lib/coach/cards";
import { chime } from "@/lib/sound";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const DECK_TITLE = "Flashcards";

export default function ReviewPage() {
  const { notes, addNote, updateNote } = useWorkspace();
  const { cardReviewed } = useStudyBro();
  const states = useCardStates();
  const cards = useMemo(() => deriveCards(notes), [notes]);
  const [now] = useState(() => Date.now());
  const due = useMemo(() => cards.filter((c) => isDue(states, c.id, now)), [cards, states, now]);
  const mastered = cards.filter((c) => stateOf(states, c.id).box >= MASTERED_BOX).length;

  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [adding, setAdding] = useState(false);

  const startReview = (all = false) => setQueue(all ? [...cards].sort(() => Math.random() - 0.5) : due);

  const addCard = (q: string, a: string) => {
    const line = `Q: ${q.trim()}\nA: ${a.trim()}`;
    const deck = notes.find((n) => n.title === DECK_TITLE);
    if (deck) updateNote(deck.id, { body: `${deck.body.trim()}\n${line}` });
    else addNote({ title: DECK_TITLE, body: line, category: "General" });
  };

  if (queue) {
    return (
      <ReviewSession
        queue={queue}
        onReview={(id, ok) => { cardStore.review(id, ok); cardReviewed(ok); }}
        onExit={() => setQueue(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Review</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-dim)]">Flashcards with spaced repetition. Cards you know come back later; cards you miss come back soon. Recall Checks during sessions use the same deck.</p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
          <Plus size={16} /> Add card
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Due now</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-[var(--text)]">{due.length}</p>
          <button
            onClick={() => startReview(false)}
            disabled={!due.length}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
          >
            <Layers size={16} /> {due.length ? `Review ${due.length} card${due.length === 1 ? "" : "s"}` : "All caught up"}
          </button>
          {!due.length && cards.length > 0 && (
            <button onClick={() => startReview(true)} className="mt-2 w-full text-center text-xs text-[var(--brand-text)] hover:underline">Practice all cards anyway</button>
          )}
        </div>
        <div className="card p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Total cards</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-[var(--text)]">{cards.length}</p>
          <p className="mt-3 text-xs text-[var(--text-dim)]">From <code className="rounded bg-[var(--surface-2)] px-1">Q:</code>/<code className="rounded bg-[var(--surface-2)] px-1">A:</code> lines in your <Link href="/notes" className="text-[var(--brand-text)] hover:underline">notes</Link>.</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Mastered</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-[var(--text)]">{mastered}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${cards.length ? (mastered / cards.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text)]">Your deck</h2>
        {cards.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[var(--text-dim)]">No cards yet.</p>
            <p className="mt-1 text-xs text-[var(--text-faint)]">Click “Add card”, or write lines like <code>Q: What is overfitting?</code> / <code>A: …</code> in any note.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {cards.map((c) => {
              const st = stateOf(states, c.id);
              const dueNow = st.due <= now;
              return (
                <li key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">{c.question}</p>
                    <p className="truncate text-xs text-[var(--text-dim)]">{c.answer}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="text-[var(--text-faint)]">{c.noteTitle}</span>
                    <BoxMeter box={st.box} />
                    <span className={cn("w-20 text-right", dueNow ? "font-semibold text-[var(--warn)]" : "text-[var(--text-faint)]")}>
                      {dueNow ? "Due" : `in ${Math.max(1, Math.round((st.due - now) / 864e5))}d`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddCardModal open={adding} onClose={() => setAdding(false)} onAdd={addCard} />
    </div>
  );
}

function BoxMeter({ box }: { box: number }) {
  return (
    <span className="flex gap-0.5" title={`Level ${box} of ${BOX_INTERVAL_DAYS.length - 1}`}>
      {BOX_INTERVAL_DAYS.slice(1).map((_, i) => (
        <span key={i} className={cn("h-3 w-1.5 rounded-sm", i < box ? "bg-emerald-400" : "bg-[var(--surface-2)]")} />
      ))}
    </span>
  );
}

function ReviewSession({ queue, onReview, onExit }: { queue: Flashcard[]; onReview: (id: string, ok: boolean) => void; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState({ ok: 0, miss: 0 });
  const card = queue[idx];
  const done = idx >= queue.length;

  const grade = useCallback((ok: boolean) => {
    if (!card || !shown) return;
    onReview(card.id, ok);
    chime(ok ? "success" : "nudge");
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), miss: s.miss + (ok ? 0 : 1) }));
    setShown(false);
    setIdx((i) => i + 1);
  }, [card, shown, onReview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!shown) setShown(true); }
      if (shown && (e.key === "1" || e.key === "ArrowLeft")) grade(false);
      if (shown && (e.key === "2" || e.key === "ArrowRight")) grade(true);
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [done, shown, grade, onExit]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"><X size={16} /> Exit</button>
        <p className="text-sm tabular-nums text-[var(--text-dim)]">{Math.min(idx + 1, queue.length)} / {queue.length}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${(idx / Math.max(1, queue.length)) * 100}%` }} />
      </div>

      {done ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--text)]">Review complete</h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">{score.ok} remembered · {score.miss} to see again soon</p>
          <button onClick={onExit} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-6 text-sm font-semibold text-white"><RotateCcw size={15} /> Back to deck</button>
        </div>
      ) : (
        <div className="card min-h-[18rem] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">{card.noteTitle}</p>
          <p className="mt-3 text-xl font-semibold leading-snug text-[var(--text)] sm:text-2xl">{card.question}</p>
          {shown ? (
            <div className="mt-6 animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">Answer</p>
              <p className="mt-1 text-base text-[var(--text)]">{card.answer}</p>
            </div>
          ) : (
            <button onClick={() => setShown(true)} className="mt-8 w-full rounded-xl border border-dashed border-[var(--border-strong)] py-4 text-sm font-medium text-[var(--text-dim)] hover:bg-[var(--surface)]">
              Show answer <span className="text-[var(--text-faint)]">(Space)</span>
            </button>
          )}
          {shown && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => grade(false)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-[var(--bad)]"><X size={16} /> Didn&apos;t know</button>
              <button onClick={() => grade(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-sm font-semibold text-[var(--good)]"><Check size={16} /> Knew it</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCardModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (q: string, a: string) => void }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !a.trim()) return;
    onAdd(q, a);
    setQ("");
    setA("");
    onClose();
  };
  const field = "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]";
  return (
    <Modal open={open} onClose={onClose} title="Add a flashcard">
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-medium text-[var(--text-dim)]">Question
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className={cn(field, "mt-1.5")} placeholder="What does a learning rate control?" />
        </label>
        <label className="block text-xs font-medium text-[var(--text-dim)]">Answer
          <input value={a} onChange={(e) => setA(e.target.value)} className={cn(field, "mt-1.5")} placeholder="The step size of each update" />
        </label>
        <p className="text-[11px] text-[var(--text-faint)]">Saved into your “{DECK_TITLE}” note, so you can edit it in Notes.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-[var(--text-dim)]">Cancel</button>
          <button type="submit" className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!q.trim() || !a.trim()}>Add card</button>
        </div>
      </form>
    </Modal>
  );
}
