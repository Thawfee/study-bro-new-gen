"use client";

import { Lock } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace-store";
import { useStudyBro } from "@/lib/store/studybro-store";
import { BadgeGrid } from "@/components/coach/BadgeGrid";
import { BADGES, dayStreak, levelFromXp, STREAK_MILESTONES, XP } from "@/lib/coach/rewards";
import { realSessions } from "@/lib/insights";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const { progress, history } = useStudyBro();
  const { tasks, notes, goals } = useWorkspace();
  const lvl = levelFromXp(progress.xp);
  const sessions = realSessions(history);
  const hours = sessions.reduce((a, s) => a + s.studyMs, 0) / 3600e3;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const milestones = [
    { icon: "🎯", title: "First session", desc: "Finish your first focus session.", p: clamp(sessions.length) },
    { icon: "⏳", title: "10 hours", desc: "Study for 10 hours in total.", p: clamp(hours / 10) },
    { icon: "🏆", title: "100 hours", desc: "Study for 100 hours in total.", p: clamp(hours / 100) },
    { icon: "✅", title: "Task master", desc: "Complete 10 tasks.", p: clamp(tasks.filter((t) => t.done).length / 10) },
    { icon: "📝", title: "Note taker", desc: "Write 5 notes.", p: clamp(notes.length / 5) },
    { icon: "🎖️", title: "Goal getter", desc: "Complete 3 goals.", p: clamp(goals.filter((g) => g.current >= g.target).length / 3) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">{progress.badges.length} of {BADGES.length} badges · {dayStreak(progress.studyDays)}-day streak</p>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <div className="text-center"><p className="text-[10px] uppercase tracking-widest opacity-80">Level</p><p className="text-3xl font-black leading-none">{lvl.level}</p></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-[var(--text)]">{lvl.name}</p>
            <p className="text-sm text-[var(--text-dim)]">{progress.xp} XP · {lvl.next - progress.xp} XP to level {lvl.level + 1}</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></div>
          </div>
        </div>
        <div className="mt-5 grid gap-2 text-xs text-[var(--text-dim)] sm:grid-cols-3">
          <p className="rounded-xl bg-[var(--surface)] px-3 py-2">🔥 Focus streaks: +{STREAK_MILESTONES[0].xp} to +{STREAK_MILESTONES[STREAK_MILESTONES.length - 1].xp} XP</p>
          <p className="rounded-xl bg-[var(--surface)] px-3 py-2">🧠 Correct Recall Check: +{XP.quizCorrect} XP</p>
          <p className="rounded-xl bg-[var(--surface)] px-3 py-2">🏁 Finished session: +{XP.sessionComplete}–{XP.sessionComplete + XP.plannedBonus} XP</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">Badges</h2>
        <BadgeGrid />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">Milestones</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {milestones.map((m) => {
            const done = m.p >= 1;
            return (
              <div key={m.title} className={cn("card flex items-center gap-3 p-4", !done && "opacity-80")}>
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl", done ? "bg-amber-500/15" : "bg-[var(--surface-2)] grayscale")}>
                  {done ? m.icon : <Lock size={16} className="text-[var(--text-faint)]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">{m.title}</p>
                  <p className="text-xs text-[var(--text-dim)]">{m.desc}</p>
                  {!done && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round(m.p * 100)}%` }} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
