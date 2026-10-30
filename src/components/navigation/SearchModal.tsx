"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckSquare, Target, NotebookPen, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { ALL_NAV } from "./navItems";
import { cn } from "@/lib/utils";

interface Result {
  label: string;
  sub: string;
  href: string;
  icon: typeof Search;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { tasks, goals, notes } = useWorkspace();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const pages: Result[] = ALL_NAV.map((n) => ({ label: n.label, sub: n.hint ?? "Page", href: n.href, icon: n.icon }));
    const taskR: Result[] = tasks.map((t) => ({ label: t.title, sub: `Task · ${t.subject}`, href: "/tasks", icon: CheckSquare }));
    const goalR: Result[] = goals.map((g) => ({ label: g.title, sub: `Goal · ${g.period}`, href: "/goals", icon: Target }));
    const noteR: Result[] = notes.map((n) => ({ label: n.title, sub: `Note · ${n.category}`, href: "/notes", icon: NotebookPen }));
    const all = [...pages, ...taskR, ...goalR, ...noteR];
    if (!term) return pages;
    return all.filter((r) => r.label.toLowerCase().includes(term) || r.sub.toLowerCase().includes(term)).slice(0, 12);
  }, [q, tasks, goals, notes]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter" && results[active]) { router.push(results[active].href); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, results, active, router, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[12vh] animate-fade-in" role="dialog" aria-modal="true" aria-label="Search">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search size={18} className="text-[var(--text-faint)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Search pages, tasks, goals, notes…"
            className="h-14 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-faint)]">No results for “{q}”.</p>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={`${r.href}-${r.label}-${i}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { router.push(r.href); onClose(); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    active === i ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface)]",
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--text)]">{r.label}</p>
                    <p className="text-[11px] text-[var(--text-faint)]">{r.sub}</p>
                  </div>
                  {active === i && <ArrowRight size={14} className="text-[var(--text-faint)]" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
