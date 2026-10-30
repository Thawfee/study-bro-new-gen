"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { chime } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "@/types/alerts";

const TOAST_TTL = 5000;

function Nudge({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: string) => void }) {
  // `dismiss` is a stable store callback, so the 1s engine tick doesn't reset this timer.
  useEffect(() => {
    if (toast.sound) chime("nudge");
    const id = setTimeout(() => dismiss(toast.id), TOAST_TTL);
    return () => clearTimeout(id);
  }, [toast.id, toast.sound, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-[22rem] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border bg-[var(--bg-elev)]/95 p-3 shadow-xl shadow-black/30 backdrop-blur-xl animate-fade-up",
        toast.severity === "critical" ? "border-rose-400/40" : toast.severity === "warning" ? "border-amber-400/40" : "border-[var(--border-strong)]",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-lg">{toast.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text)]">{toast.title}</p>
        <p className="truncate text-xs text-[var(--text-dim)]">{toast.message}</p>
      </div>
      <button onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="rounded-md p-1 text-[var(--text-faint)] hover:text-[var(--text)]">
        <X size={14} />
      </button>
    </div>
  );
}

/** Non-blocking nudges, top-center. */
export function ToastHost() {
  const { toasts, dismissToast } = useStudyBro();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <Nudge key={t.id} toast={t} dismiss={dismissToast} />
      ))}
    </div>
  );
}
