"use client";

import { Lock } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { BADGES } from "@/lib/coach/rewards";
import { cn } from "@/lib/utils";

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div className={cn("h-full rounded-full transition-all duration-700", className)} style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  );
}

/* ------------------------------ Badges ------------------------------- */

export function BadgeGrid() {
  const { progress } = useStudyBro();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {BADGES.map((b) => {
        const unlocked = progress.badges.includes(b.id);
        const pct = Math.round(b.progress(progress) * 100);
        return (
          <div key={b.id} className={cn("rounded-2xl border p-3.5 transition-all", unlocked ? "border-amber-400/30 bg-amber-500/10" : "border-[var(--border)] bg-[var(--surface)]/60")}>
            <span className={cn("grid h-10 w-10 place-items-center rounded-xl border text-xl", unlocked ? "border-amber-400/40 bg-amber-500/10" : "border-[var(--border)] bg-[var(--surface)] grayscale")}>
              {unlocked ? b.icon : <Lock size={15} className="text-[var(--text-faint)]" />}
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{b.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-dim)]">{b.description}</p>
            {!unlocked && (
              <div className="mt-2">
                <Bar value={pct / 100} className="bg-amber-400" />
                <p className="mt-1 text-[10px] text-[var(--text-faint)]">{pct}%</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

