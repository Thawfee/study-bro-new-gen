"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { clockText, sessionClock } from "@/lib/study-state";
import { cn } from "@/lib/utils";

/** Header pill: start a session, or see the running one from any page. */
export function SessionPill() {
  const { phase, plan, session, pauseReason } = useStudyBro();

  if (phase !== "running" && phase !== "paused") {
    return (
      <Link href="/focus" className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--brand)] px-3.5 text-sm font-semibold text-white shadow-sm hover:brightness-110">
        <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">Start session</span><span className="sm:hidden">Focus</span>
      </Link>
    );
  }

  const clock = sessionClock(session.metrics.studyTimeMs, plan?.durationMin ?? null);
  const paused = phase === "paused";
  return (
    <Link
      href="/focus"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold tabular-nums transition-colors",
        paused ? "border-amber-400/40 bg-amber-500/10 text-[var(--warn)]" : "border-emerald-400/40 bg-emerald-500/10 text-[var(--good)]",
      )}
      title="Open your focus session"
    >
      <span className={cn("h-2 w-2 rounded-full", paused ? "bg-amber-400" : "animate-pulse bg-emerald-400")} />
      {clockText(clock.mainMs)}
      <span className="hidden text-xs font-medium opacity-80 sm:inline">
        {paused ? (pauseReason === "break" ? "· break" : pauseReason === "away" ? "· away" : "· paused") : clock.countdown ? "left" : "elapsed"}
      </span>
    </Link>
  );
}
