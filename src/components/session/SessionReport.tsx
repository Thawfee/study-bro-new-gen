"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock, Flame, Gauge, Sparkles, Target, Brain } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useCameraControl } from "@/components/camera/CameraProvider";
import { cn, formatDuration, formatTime } from "@/lib/utils";

const LAPSE_META: Record<string, { icon: string; label: string }> = {
  drowsiness: { icon: "😴", label: "Drowsy" },
  phone: { icon: "📱", label: "Phone" },
  distraction: { icon: "👀", label: "Look-aways" },
  posture: { icon: "🪑", label: "Posture" },
  away: { icon: "🚶", label: "Stepped away" },
  tab: { icon: "🗂️", label: "Tab switches" },
};

export function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "from-emerald-400 to-teal-500";
  if (grade === "B") return "from-cyan-400 to-blue-500";
  if (grade === "C") return "from-amber-400 to-orange-500";
  if (grade === "—") return "from-slate-400 to-slate-500";
  return "from-rose-400 to-pink-500";
}

/** End-of-session report (modal). Opens from anywhere when a session ends. */
export function SessionReport() {
  const { summary, phase, closeSummary } = useStudyBro();
  const { active, stop } = useCameraControl();
  const router = useRouter();

  // Privacy: the camera turns off when the session ends.
  useEffect(() => {
    if (phase === "summary" && active) stop();
  }, [phase, active, stop]);

  if (phase !== "summary" || !summary) return null;
  const s = summary;
  const lapseEntries = Object.entries(s.lapses).filter(([, n]) => n > 0);

  const again = () => {
    closeSummary();
    router.push("/focus");
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Session report">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[var(--border-strong)] bg-[var(--bg-elev)] shadow-2xl animate-scale-in sm:rounded-3xl">
        <div className="flex items-center gap-4 border-b border-[var(--border)] p-5 sm:p-6">
          <div className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-black text-white shadow-lg", gradeTone(s.grade))}>
            {s.grade}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              {s.demo ? "Demo session report" : s.completed ? "Session complete" : "Session report"}
            </p>
            <h2 className="truncate text-xl font-bold text-[var(--text)]">{s.task || "Focus session"}</h2>
            <p className="text-xs text-[var(--text-dim)]">
              {s.subject} · {formatTime(s.startedAt)}–{formatTime(s.endedAt)}
              {s.plannedMin ? ` · planned ${s.plannedMin} min` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat icon={Clock} label="Session time" value={formatDuration(s.studyMs)} />
            <Stat icon={Target} label="Focused" value={`${s.focusPct}%`} sub={formatDuration(s.focusedMs)} />
            <Stat icon={Gauge} label="Focus score" value={`${s.score}`} />
            <Stat icon={Flame} label="Best streak" value={formatDuration(s.bestStreakMs)} />
            <Stat icon={Brain} label="Recall checks" value={s.quiz.total ? `${s.quiz.correct}/${s.quiz.total}` : "—"} />
            <Stat icon={Sparkles} label="XP earned" value={`+${s.xpEarned}`} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">What pulled you away</p>
            {lapseEntries.length === 0 ? (
              <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">Nothing — a clean session. 🎯</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lapseEntries.map(([k, n]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)]">
                    {LAPSE_META[k].icon} {LAPSE_META[k].label} <strong className="tabular-nums">×{n}</strong>
                  </span>
                ))}
              </div>
            )}
            {s.avgRecoveryMs != null && (
              <p className="mt-2 text-xs text-[var(--text-dim)]">Average recovery after an alert: <strong className="text-[var(--text)]">{Math.max(1, Math.round(s.avgRecoveryMs / 1000))}s</strong></p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Coach tips for next time</p>
            <ul className="space-y-2">
              {s.tips.map((t) => (
                <li key={t.text} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]">
                  <span>{t.icon}</span>
                  <span className="leading-relaxed">{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] p-5 sm:flex-row sm:justify-end sm:p-6">
          <button onClick={closeSummary} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
            Done
          </button>
          <button onClick={again} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
            Start another session
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]"><Icon size={12} /> {label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text)]">{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-faint)]">{sub}</p>}
    </div>
  );
}
