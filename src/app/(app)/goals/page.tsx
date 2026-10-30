"use client";

import { useState } from "react";
import { Plus, Minus, Target, Pencil, Trash2, Check } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { PageHeader, EmptyState, ProgressBar } from "@/components/ui/common";
import { Button } from "@/components/ui/Button";
import { GoalModal } from "@/components/goals/GoalModal";
import type { Goal } from "@/types/goals";
import { cn } from "@/lib/utils";

const PERIOD_CLS: Record<string, string> = {
  daily: "border-violet-400/30 bg-violet-500/10 text-[var(--brand-text)]",
  weekly: "border-cyan-400/30 bg-cyan-500/10 text-[var(--accent)]",
  monthly: "border-amber-400/30 bg-amber-500/10 text-[var(--warn)]",
};

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader title="Goals" subtitle="Daily, weekly and monthly targets.">
        <Button icon={Plus} onClick={openNew}>New Goal</Button>
      </PageHeader>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet, Bro." message="Set a daily, weekly, or monthly goal and track your progress.">
          <Button icon={Plus} onClick={openNew}>Add a goal</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const pct = g.target ? g.current / g.target : 0;
            const done = g.current >= g.target;
            return (
              <div key={g.id} className="card group p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", PERIOD_CLS[g.period])}>
                    {g.period}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => { setEditing(g); setOpen(true); }} aria-label="Edit goal" className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteGoal(g.id)} aria-label="Delete goal" className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-rose-500/10 hover:text-[var(--bad)]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[var(--text)]">{g.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-dim)]">
                  <span className="font-semibold text-[var(--text)]">{g.current}</span> / {g.target} {g.unit}
                </p>

                <div className="mt-3">
                  <ProgressBar value={pct} tone={done ? "good" : "brand"} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--good)]">
                      <Check size={14} /> Completed!
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-faint)]">{Math.round(pct * 100)}% there</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateGoal(g.id, { current: Math.max(0, g.current - 1) })}
                      aria-label="Decrease"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => updateGoal(g.id, { current: g.current + 1 })}
                      aria-label="Increase"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-[var(--brand-text)] hover:bg-violet-500/15"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSave={(data) => {
          if (editing) updateGoal(editing.id, data);
          else addGoal(data);
        }}
      />
    </div>
  );
}
