/* Shared visual tone tokens so every status/severity looks consistent. */

import type { Severity } from "@/types/ai";

export type Tone = "good" | "warn" | "bad" | "brand" | "neutral";

interface ToneClasses {
  text: string;
  bg: string;
  border: string;
  dot: string;
  ring: string;
}

export const TONE: Record<Tone, ToneClasses> = {
  good: {
    text: "text-[var(--good)]",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/30",
    dot: "bg-emerald-400",
    ring: "text-emerald-400",
  },
  warn: {
    text: "text-[var(--warn)]",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
    dot: "bg-amber-400",
    ring: "text-amber-400",
  },
  bad: {
    text: "text-[var(--bad)]",
    bg: "bg-rose-500/10",
    border: "border-rose-400/30",
    dot: "bg-rose-400",
    ring: "text-rose-400",
  },
  brand: {
    text: "text-[var(--brand-text)]",
    bg: "bg-indigo-500/10",
    border: "border-indigo-400/30",
    dot: "bg-indigo-400",
    ring: "text-indigo-400",
  },
  neutral: {
    text: "text-[var(--text-dim)]",
    bg: "bg-[var(--surface)]",
    border: "border-[var(--border)]",
    dot: "bg-slate-400",
    ring: "text-[var(--text-dim)]",
  },
};

export function severityTone(s: Severity): Tone {
  if (s === "critical") return "bad";
  if (s === "warning") return "warn";
  return "good";
}
