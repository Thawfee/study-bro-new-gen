"use client";

import { useMemo, useState } from "react";
import { Plus, CheckSquare, ClipboardList } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { PageHeader, EmptyState } from "@/components/ui/common";
import { Button } from "@/components/ui/Button";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskModal } from "@/components/tasks/TaskModal";
import type { Task } from "@/types/tasks";
import { cn } from "@/lib/utils";

type Filter = "today" | "upcoming" | "completed";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export default function TasksPage() {
  const { tasks, addTask, updateTask, toggleTask, deleteTask } = useWorkspace();
  const [filter, setFilter] = useState<Filter>("today");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    if (filter === "completed") return tasks.filter((t) => t.done);
    const open = tasks.filter((t) => !t.done);
    if (filter === "today") return open.filter((t) => !t.dueDate || t.dueDate <= today);
    return open.filter((t) => t.dueDate && t.dueDate > today);
  }, [tasks, filter, today]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: Task) => { setEditing(t); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" subtitle="Plan your day. Doubts you save during a session land here too.">
        <Button icon={Plus} onClick={openNew}>New Task</Button>
      </PageHeader>

      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "completed"
            ? tasks.filter((t) => t.done).length
            : f.key === "today"
              ? tasks.filter((t) => !t.done && (!t.dueDate || t.dueDate <= today)).length
              : tasks.filter((t) => !t.done && t.dueDate && t.dueDate > today).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-violet-400/40 bg-violet-500/15 text-[var(--brand-text)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)]",
              )}
            >
              {f.label}
              <span className="rounded-full bg-[var(--surface-2)] px-1.5 text-[11px]">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === "completed" ? "Nothing completed yet" : "No tasks here, Bro."}
          message={filter === "completed" ? "Finish a task and it'll show up here." : "Let's get something done. Add your first task."}
        >
          {filter !== "completed" && <Button icon={Plus} onClick={openNew}>Add a task</Button>}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t.id)}
              onEdit={() => openEdit(t)}
              onDelete={() => deleteTask(t.id)}
            />
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={(data) => {
          if (editing) updateTask(editing.id, data);
          else addTask(data);
        }}
      />
    </div>
  );
}
