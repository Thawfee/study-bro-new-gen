"use client";

import { useStudyBro } from "@/lib/store/studybro-store";
import { cn, formatTime } from "@/lib/utils";

/** Compact, readable timeline of what happened in this session. */
export function SessionTimeline({ limit = 8, className }: { limit?: number; className?: string }) {
  const { events } = useStudyBro();
  const list = events.slice(0, limit);
  return (
    <div className={cn("card p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Session timeline</h3>
        <span className="text-[11px] text-[var(--text-faint)]">{events.length} events</span>
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] py-6 text-center text-xs text-[var(--text-faint)]">Events appear here as your session runs.</p>
      ) : (
        <ol className="relative space-y-0.5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[var(--border)]">
          {list.map((e) => (
            <li key={e.id} className="relative flex items-start gap-3 rounded-lg py-1.5">
              <span
                className={cn(
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-[var(--bg-elev)] text-sm",
                  e.severity === "critical" ? "border-rose-400/40" : e.severity === "warning" ? "border-amber-400/40" : "border-[var(--border)]",
                )}
              >
                {e.icon}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm leading-snug text-[var(--text)]">{e.message}</p>
                <p className="text-[11px] text-[var(--text-faint)]">{formatTime(e.timestamp)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
