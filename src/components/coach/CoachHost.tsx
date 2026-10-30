"use client";

/* Floating AI Coach surfaces: confusion help, smart-break suggestion,
   the break overlay and celebration cards. Mounted once in the app layout. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, HelpCircle, NotebookPen, X } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useWorkspace } from "@/lib/store/workspace-store";
import type { Celebration } from "@/types/coach";
import { formatClock, formatTime } from "@/lib/utils";
import { chime, configureSound, unlockAudio } from "@/lib/sound";
import { SessionReport } from "@/components/session/SessionReport";

const HELP_AUTO_DISMISS_MS = 30_000;
const CELEBRATION_TTL = 4600;

export function CoachHost() {
  return (
    <>
      <SoundSync />
      <div className="pointer-events-none fixed bottom-24 left-3 z-[85] flex w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col gap-3 sm:left-6 lg:bottom-6 lg:left-[19rem]">
        <HelpPromptCard />
        <BreakSuggestionCard />
      </div>
      <BreakOverlay />
      <CelebrationStack />
      <SessionReport />
    </>
  );
}

/** Keeps the sound engine in sync with settings and unlocks audio on first tap. */
function SoundSync() {
  const { settings } = useStudyBro();
  useEffect(() => {
    configureSound({ volume: settings.volume, enabled: settings.soundEnabled });
  }, [settings.volume, settings.soundEnabled]);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  return null;
}

/* ----------------------------- Confusion ----------------------------- */

function HelpPromptCard() {
  const { helpPrompt, resolveHelp } = useStudyBro();
  const { tasks, addTask } = useWorkspace();
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");

  const currentTask = useMemo(() => tasks.find((t) => !t.done), [tasks]);

  useEffect(() => {
    if (!helpPrompt) return;
    const id = setTimeout(() => resolveHelp("dismiss"), HELP_AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [helpPrompt, resolveHelp]);

  if (!helpPrompt) return null;

  const close = (outcome: "doubt" | "notes" | "dismiss") => {
    setWriting(false);
    setText("");
    resolveHelp(outcome);
  };

  const saveDoubt = () => {
    const topic = text.trim() || (currentTask ? `while working on “${currentTask.title}”` : `from ${formatTime(helpPrompt.createdAt)}`);
    addTask({
      title: `❓ Doubt: ${topic}`,
      subject: currentTask?.subject ?? "General",
      priority: "medium",
      dueDate: null,
    });
    close("doubt");
  };

  return (
    <div className="pointer-events-auto animate-fade-up rounded-2xl border border-violet-400/30 bg-[var(--bg-elev)]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-xl">🤔</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text)]">Stuck on something, Bro?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-dim)]">
            {helpPrompt.source === "demo" ? "Demo: " : ""}Your brow has been furrowed for a while. That&apos;s normal when learning hard stuff — no penalty.
          </p>
        </div>
        <button onClick={() => close("dismiss")} aria-label="Dismiss" className="rounded-md p-1 text-[var(--text-faint)] hover:text-[var(--text)]"><X size={14} /></button>
      </div>

      {writing ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => { e.preventDefault(); saveDoubt(); }}
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentTask ? `e.g. a doubt in “${currentTask.title}”` : "What's confusing you?"}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-violet-400/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white">Save to Tasks</button>
            <button type="button" onClick={() => setWriting(false)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-dim)]">Back</button>
          </div>
        </form>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => setWriting(true)} className="flex flex-col items-center gap-1 rounded-xl border border-violet-400/25 bg-violet-500/10 px-2 py-2 text-[11px] font-semibold text-violet-100 hover:bg-violet-500/15">
            <HelpCircle size={15} /> Save doubt
          </button>
          <button onClick={() => { close("notes"); router.push("/notes"); }} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
            <NotebookPen size={15} /> Open notes
          </button>
          <button onClick={() => close("dismiss")} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-[11px] font-semibold text-[var(--text-dim)] hover:bg-[var(--surface-2)]">
            <span className="text-sm leading-none">👍</span> I&apos;m good
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Smart breaks ---------------------------- */

function BreakSuggestionCard() {
  const { breakSuggestion, startBreak, dismissBreakSuggestion, settings, intervention } = useStudyBro();
  useEffect(() => {
    if (breakSuggestion) chime("break");
  }, [breakSuggestion]);
  if (!breakSuggestion || intervention) return null;
  return (
    <div className="pointer-events-auto animate-fade-up rounded-2xl border border-amber-400/30 bg-[var(--bg-elev)]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-xl">🧘</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text)]">Break recommended · fatigue risk {breakSuggestion.risk}%</p>
          <p className="mt-0.5 text-xs text-[var(--text-dim)]">Rest now, before your focus crashes.</p>
        </div>
      </div>
      {breakSuggestion.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {breakSuggestion.reasons.slice(0, 3).map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-dim)]">
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-[var(--warn)]">+{r.points}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <button onClick={startBreak} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black">
          <Coffee size={14} /> Take a {settings.breakMinutes}-min break
        </button>
        <button onClick={dismissBreakSuggestion} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-dim)] hover:text-[var(--text)]">Keep going</button>
      </div>
    </div>
  );
}

function BreakOverlay() {
  const { breakState, now, endBreak } = useStudyBro();
  if (!breakState) return null;
  const remaining = Math.max(0, Math.ceil((breakState.endsAt - (now || breakState.startedAt)) / 1000));
  const total = (breakState.endsAt - breakState.startedAt) / 1000;
  const pct = total > 0 ? 1 - remaining / total : 1;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] p-6 backdrop-blur-xl animate-fade-in" role="dialog" aria-modal="true" aria-label="Break in progress">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative grid h-52 w-52 place-items-center">
          <div className="animate-breathe absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 via-cyan-400/25 to-violet-500/30 blur-[2px]" />
          <div className="absolute inset-6 rounded-full border border-white/10" />
          <div className="relative">
            <p className="text-4xl font-bold tabular-nums text-[var(--text)]">{formatClock(remaining)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-faint)]">break</p>
          </div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-[var(--text)]">Breathe with the circle</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
          Stand up, drink some water, and look at something 20 feet away for 20 seconds. Your session timer is paused — nothing counts against you.
        </p>
        <div className="mt-5 h-1.5 w-64 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-700" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
        <button onClick={endBreak} className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]">
          I&apos;m ready — end break
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Celebrations ---------------------------- */

const CONFETTI_COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#818cf8"];

function CelebrationCard({ c, dismiss }: { c: Celebration; dismiss: (id: string) => void }) {
  // `dismiss` is a stable store callback, so the timer isn't reset by the 1s engine tick.
  useEffect(() => {
    if (c.xp > 0) chime("success");
    const id = setTimeout(() => dismiss(c.id), CELEBRATION_TTL);
    return () => clearTimeout(id);
  }, [c.id, c.xp, dismiss]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dx: `${((i * 53) % 80) - 40}px`,
        rot: `${180 + ((i * 97) % 540)}deg`,
        delay: `${(i * 41) % 260}ms`,
      })),
    [],
  );

  return (
    <div className="pointer-events-auto relative w-80 max-w-[90vw] animate-scale-in overflow-visible">
      <div className="pointer-events-none absolute inset-x-0 -top-2 h-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: p.left, background: p.color, ["--dx" as string]: p.dx, ["--rot" as string]: p.rot, ["--delay" as string]: p.delay }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-[var(--bg-elev)]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-2xl">{c.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{c.title}</p>
          <p className="truncate text-xs text-[var(--text-dim)]">{c.detail}</p>
        </div>
        {c.xp > 0 && <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-1 text-xs font-bold tabular-nums text-[var(--warn)]">+{c.xp} XP</span>}
      </div>
    </div>
  );
}

function CelebrationStack() {
  const { celebrations, dismissCelebration } = useStudyBro();
  if (!celebrations.length) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[105] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {celebrations.slice(-2).map((c) => (
        <CelebrationCard key={c.id} c={c} dismiss={dismissCelebration} />
      ))}
    </div>
  );
}
