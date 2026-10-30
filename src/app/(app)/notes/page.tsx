"use client";

import { useMemo, useState } from "react";
import { Plus, Search, NotebookPen } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { PageHeader, EmptyState } from "@/components/ui/common";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { NoteModal } from "@/components/notes/NoteModal";
import { NOTE_CATEGORIES, type Note, type NoteCategory } from "@/types/notes";
import { cn, timeAgo } from "@/lib/utils";

const CAT_CLS: Record<string, string> = {
  Python: "border-amber-400/30 bg-amber-500/10 text-[var(--warn)]",
  "AI/ML": "border-violet-400/30 bg-violet-500/10 text-[var(--brand-text)]",
  College: "border-cyan-400/30 bg-cyan-500/10 text-[var(--accent)]",
  Projects: "border-emerald-400/30 bg-emerald-500/10 text-[var(--good)]",
  General: "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]",
};

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useWorkspace();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<NoteCategory | "All">("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return notes.filter(
      (n) =>
        (cat === "All" || n.category === cat) &&
        (!term || n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term)),
    );
  }, [notes, q, cat]);

  const openNew = () => { setEditing(null); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader title="Study Notes" subtitle="Write notes by subject. Lines like “Q: …” then “A: …” become flashcards for Review and Recall Checks.">
        <Button icon={Plus} onClick={openNew}>New Note</Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...NOTE_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                cat === c ? "border-violet-400/40 bg-violet-500/15 text-[var(--brand-text)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)]",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Your study notes are waiting for you." message={q || cat !== "All" ? "No notes match your filter." : "Jot down your first idea, formula, or reminder."}>
          {!q && cat === "All" && <Button icon={Plus} onClick={openNew}>Add a note</Button>}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { setEditing(n); setOpen(true); }}
              className="card flex flex-col p-4 text-left transition-colors hover:border-[var(--border-strong)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", CAT_CLS[n.category])}>{n.category}</span>
                <span className="text-[10px] text-[var(--text-faint)]">{timeAgo(n.updatedAt)}</span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text)]">{n.title}</h3>
              <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-[var(--text-dim)]">{n.body || "No content yet."}</p>
            </button>
          ))}
        </div>
      )}

      <NoteModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onDelete={editing ? () => deleteNote(editing.id) : undefined}
        onSave={(data) => {
          if (editing) updateNote(editing.id, data);
          else addNote(data);
        }}
      />
    </div>
  );
}
