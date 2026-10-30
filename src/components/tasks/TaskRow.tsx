"use client";

import { Check, Pencil, Trash2, Calendar } from "lucide-react";
import type { Task, Priority } from "@/types/tasks";
import { cn } from "@/lib/utils";

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: "High", cls: "border-rose-400/30 bg-rose-500/10 text-[var(--bad)]" },
  medium: { label: "Medium", cls: "border-amber-400/30 bg-amber-500/10 text-[var(--warn)]" },
  low: { label: "Low", cls: "border-emerald-400/30 bg-emerald-500/10 text-[var(--good)]" },
};

function fmtDue(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const due = fmtDue(task.dueDate);
  const overdue = due?.includes("overdue");
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <button
        onClick={onToggle}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors",
          task.done ? "border-emerald-400/50 bg-emerald-500/20 text-[var(--good)]" : "border-[var(--border-strong)] text-transparent hover:border-emerald-400/50",
        )}
      >
        <Check size={14} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", task.done ? "text-[var(--text-faint)] line-through" : "text-[var(--text)]")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-[var(--text-faint)]">{task.subject}</span>
          <span className={cn("rounded-full border px-1.5 py-0.5 font-medium", PRIORITY[task.priority].cls)}>
            {PRIORITY[task.priority].label}
          </span>
          {due && (
            <span className={cn("inline-flex items-center gap-1", overdue ? "text-[var(--bad)]" : "text-[var(--text-faint)]")}>
              <Calendar size={11} /> {due}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <button onClick={onEdit} aria-label="Edit task" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
            <Pencil size={14} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} aria-label="Delete task" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-dim)] hover:bg-rose-500/10 hover:text-[var(--bad)]">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
