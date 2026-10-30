"use client";

/* Blocking interventions (no video): Recall Check, wake alarm, phone-down.
   Sound comes from the WebAudio engine; live interventions close themselves
   when the camera confirms recovery. */

import { useEffect, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, Smartphone, XCircle } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { chime, notify, startAlarm, stopAlarm } from "@/lib/sound";
import type { Intervention } from "@/types/alerts";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

export function InterventionHost() {
  const { intervention, mode, answerQuiz, resolveIntervention, settings } = useStudyBro();
  const live = mode === "live";

  const waking = !!intervention && intervention.type === "drowsiness" && intervention.conditionClearedAt == null && !intervention.quizAnswered && (intervention.kind === "wake" || (intervention.kind === "quiz" && live));
  const alarmKind: "wake" | "phone" | null = !intervention ? null : intervention.kind === "phone" ? "phone" : waking ? "wake" : null;

  // Alarm loop while the condition is active.
  useEffect(() => {
    if (!alarmKind) return;
    startAlarm(alarmKind);
    return () => stopAlarm();
  }, [alarmKind, intervention?.id]);

  // One-shot chime when a question appears + desktop notification if hidden.
  const ivId = intervention?.id;
  useEffect(() => {
    if (!ivId || !intervention) return;
    if (intervention.kind === "quiz" && !waking) chime("alert");
    if (typeof document !== "undefined" && document.hidden && settings.desktopNotifications) notify(intervention.title, intervention.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ivId, waking]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!intervention) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [intervention]);

  if (!intervention) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" role="alertdialog" aria-modal="true" aria-label={intervention.title}>
      <div className={cn("absolute inset-0 backdrop-blur-md", alarmKind ? "bg-rose-950/80" : "bg-black/70")} />
      {alarmKind && <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.25),transparent_60%)]" />}
      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev)] shadow-2xl">
        {intervention.kind === "phone" ? (
          <PhonePanel iv={intervention} live={live} onResolve={resolveIntervention} />
        ) : waking ? (
          <WakePanel iv={intervention} live={live} onResolve={resolveIntervention} />
        ) : (
          <QuizPanel key={intervention.id} iv={intervention} onAnswer={answerQuiz} onClose={resolveIntervention} />
        )}
      </div>
    </div>
  );
}

function Header({ icon, tone, eyebrow, title, message }: { icon: React.ReactNode; tone: string; eyebrow: string; title: string; message: string }) {
  return (
    <div className="flex items-start gap-4 px-6 pt-6">
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl", tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">{eyebrow}</p>
        <h2 className="mt-0.5 text-xl font-bold text-[var(--text)]">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-dim)]">{message}</p>
      </div>
    </div>
  );
}

function ElapsedBadge({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{Math.max(0, Math.floor((now - since) / 1000))}s</span>;
}

function WakePanel({ iv, live, onResolve }: { iv: Intervention; live: boolean; onResolve: () => void }) {
  const isQuiz = iv.kind === "quiz";
  return (
    <>
      <Header icon="⏰" tone="bg-rose-500/15" eyebrow="Drowsiness detected" title={iv.title} message={iv.message} />
      <div className="px-6 py-5">
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-[var(--text)]">
          {live
            ? isQuiz
              ? "Open your eyes — the alarm stops and your question appears as soon as the camera sees them open."
              : "Open your eyes — the alarm stops by itself as soon as the camera sees them open."
            : "Demo mode: tap the button when you're awake."}
          <p className="mt-2 text-xs text-[var(--bad)]/70">Alarm running for <ElapsedBadge since={iv.createdAt} /></p>
        </div>
        {!live && (
          <button onClick={onResolve} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-white hover:brightness-110">
            I&apos;m awake
          </button>
        )}
      </div>
    </>
  );
}

function PhonePanel({ iv, live, onResolve }: { iv: Intervention; live: boolean; onResolve: () => void }) {
  return (
    <>
      <Header icon={<Smartphone className="text-[var(--warn)]" />} tone="bg-amber-500/15" eyebrow="Phone detected" title={iv.title} message={iv.message} />
      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-dim)]">
          {["Face-down", "Out of reach", "Silent mode"].map((t) => (
            <div key={t} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-3">{t}</div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--text-faint)]">
          {live ? <>Waiting for the phone to leave the frame · <ElapsedBadge since={iv.createdAt} /></> : "Demo mode: confirm when it's away."}
        </p>
        {!live && (
          <button onClick={onResolve} className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-white hover:brightness-110">
            Phone is away
          </button>
        )}
      </div>
    </>
  );
}

function QuizPanel({ iv, onAnswer, onClose }: { iv: Intervention; onAnswer: (i: number) => void; onClose: () => void }) {
  const quiz = iv.quiz!;
  const [selected, setSelected] = useState<number | null>(null);
  const doneRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selected != null) doneRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected == null) {
        const k = e.key.toUpperCase();
        const idx = /^[1-4]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
        if (idx >= 0 && idx < quiz.options.length) {
          setSelected(idx);
          onAnswer(idx);
          chime(idx === quiz.answerIndex ? "success" : "nudge");
        }
      } else if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, quiz.options.length, quiz.answerIndex, onAnswer, onClose]);

  const pick = (i: number) => {
    if (selected != null) return;
    setSelected(i);
    onAnswer(i);
    chime(i === quiz.answerIndex ? "success" : "nudge");
  };

  const correct = selected === quiz.answerIndex;
  const [firstLine, ...rest] = quiz.prompt.split("\n");

  return (
    <>
      <Header
        icon={<BrainCircuit className="text-[var(--accent)]" />}
        tone="bg-cyan-500/15"
        eyebrow={quiz.sourceTitle ? `Recall Check · ${quiz.sourceTitle}` : "Recall Check"}
        title={iv.title}
        message={iv.message}
      />
      <div className="px-6 pb-6 pt-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-base font-semibold text-[var(--text)]">{firstLine}</p>
          {rest.length > 0 && <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">{rest.join(" ")}</p>}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {quiz.options.map((opt, i) => {
            const isAnswer = i === quiz.answerIndex;
            const isPicked = i === selected;
            return (
              <button
                key={`${opt}-${i}`}
                onClick={() => pick(i)}
                disabled={selected != null}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                  selected == null && "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--brand)] hover:bg-violet-500/10 active:scale-[0.98]",
                  selected != null && isAnswer && "border-emerald-400/50 bg-emerald-500/15 text-[var(--text)]",
                  selected != null && isPicked && !isAnswer && "border-rose-400/50 bg-rose-500/15 text-[var(--text)]",
                  selected != null && !isAnswer && !isPicked && "border-[var(--border)] text-[var(--text-faint)] opacity-60",
                )}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-xs font-bold">{LETTERS[i]}</span>
                <span className="min-w-0 break-words">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected != null && (
          <div className={cn("mt-3 rounded-xl border p-3 text-sm animate-fade-in", correct ? "border-emerald-400/30 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10")}>
            <p className={cn("flex items-center gap-2 font-semibold", correct ? "text-emerald-400" : "text-amber-400")}>
              {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {correct ? "Correct — welcome back. +15 XP" : "Not quite — now you've revised it. +5 XP"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-dim)]">{quiz.explanation}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="hidden text-[11px] text-[var(--text-faint)] sm:block">
            {selected == null ? "Keys 1–4 to answer" : "Enter to continue"}
          </p>
          {selected != null && (
            <button ref={doneRef} onClick={onClose} className="ml-auto rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              Back to studying
            </button>
          )}
        </div>
      </div>
    </>
  );
}
