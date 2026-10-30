"use client";

import { FlaskConical } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import type { DetectionType } from "@/types/ai";

const TRIGGERS: { type: DetectionType; emoji: string; label: string }[] = [
  { type: "drowsiness", emoji: "😴", label: "Drowsy" },
  { type: "phone", emoji: "📱", label: "Phone" },
  { type: "distraction", emoji: "👀", label: "Look away" },
  { type: "posture", emoji: "🪑", label: "Slouch" },
  { type: "away", emoji: "🚶", label: "Step away" },
];

/**
 * Simulated detections for presenting without a camera. Clearly labelled
 * as demo; it never runs while the live camera AI is active.
 */
export function DemoControlPanel({ compact = false }: { compact?: boolean }) {
  const { trigger, reportConfusion, suggestBreak, mode } = useStudyBro();
  const disabled = mode === "live";
  const btn = "flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className={compact ? "" : "card p-5"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Demo tools</h3>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--warn)]">Simulated</span>
        </div>
      )}
      <p className="mb-3 text-xs text-[var(--text-dim)]">
        {disabled ? "Turn the camera off to use simulated detections." : "Simulate a detection to show the full flow without a camera."}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TRIGGERS.map((t) => (
          <button key={t.type} disabled={disabled} onClick={() => trigger(t.type)} className={btn}>
            <span className="text-base">{t.emoji}</span> {t.label}
          </button>
        ))}
        <button disabled={disabled} onClick={() => reportConfusion("demo")} className={btn}>
          <span className="text-base">🤔</span> Stuck
        </button>
        <button disabled={disabled} onClick={suggestBreak} className={btn}>
          <span className="text-base">🧘</span> Tired
        </button>
      </div>
    </div>
  );
}
