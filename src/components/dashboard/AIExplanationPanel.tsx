"use client";

import { BrainCircuit, ShieldQuestion, Sparkles } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { formatTime } from "@/lib/utils";

/** "Why did StudyBro alert me?" — explains the latest AI decision. */
export function AIExplanationPanel() {
  const { explanation } = useStudyBro();

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-[var(--brand-text)]">
          <BrainCircuit size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">AI Explanation</h3>
          <p className="text-xs text-[var(--text-faint)]">Why StudyBro changed the state and what it decided to do</p>
        </div>
      </div>

      {!explanation ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 py-8 text-center">
          <ShieldQuestion className="h-7 w-7 text-slate-500" />
          <p className="text-sm text-[var(--text-dim)]">No alert explanation yet.</p>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--text-faint)]">
            Once StudyBro intervenes, the reason, confidence and action appear here in a judge-friendly format.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">Alert</p>
                <p className="mt-1 text-base font-semibold text-[var(--text)]">{explanation.alert}</p>
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">{formatTime(explanation.timestamp)}</span>
            </div>
          </div>

          <Field label="Why?">
            <span className="text-[var(--text)]">{explanation.reason}</span>
          </Field>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-faint)]">Focus confidence</p>
              <span className="text-sm font-semibold tabular-nums text-[var(--brand-text)]">{Math.round(explanation.confidence * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.round(explanation.confidence * 100)}%` }}
              />
            </div>
          </div>

          <Field label="Action">
            <span className="inline-flex items-center gap-2 text-[var(--text)]">
              <Sparkles size={14} className="text-[var(--brand-text)]" />
              {explanation.action}
            </span>
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 px-3.5 py-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-faint)]">{label}</p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
