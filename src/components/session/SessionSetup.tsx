"use client";

import { useMemo, useState } from "react";
import { Camera, CameraOff, Check, Play, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useWorkspace } from "@/lib/store/workspace-store";
import { useCameraControl } from "@/components/camera/CameraProvider";
import { requestNotificationPermission, unlockAudio } from "@/lib/sound";
import { cn } from "@/lib/utils";

const DURATIONS: { label: string; value: number | null; hint: string }[] = [
  { label: "25 min", value: 25, hint: "Pomodoro" },
  { label: "50 min", value: 50, hint: "Deep work" },
  { label: "90 min", value: 90, hint: "Long block" },
  { label: "No limit", value: null, hint: "Open-ended" },
];

/** "Plan your session" — pick a task, a length, and whether to use the camera. */
export function SessionSetup() {
  const { settings, startSession } = useStudyBro();
  const { tasks } = useWorkspace();
  const camera = useCameraControl();

  const openTasks = useMemo(() => tasks.filter((t) => !t.done).slice(0, 6), [tasks]);
  const [taskId, setTaskId] = useState<string | null>(openTasks[0]?.id ?? null);
  const [custom, setCustom] = useState("");
  const [duration, setDuration] = useState<number | null>(settings.defaultDurationMin || null);
  const [customMin, setCustomMin] = useState("");
  const [useCamera, setUseCamera] = useState(settings.cameraByDefault);

  const selectedTask = openTasks.find((t) => t.id === taskId) ?? null;
  const effectiveDuration = customMin ? Math.max(1, Math.min(240, Number(customMin) || 0)) : duration;
  const taskLabel = selectedTask ? selectedTask.title : custom.trim();

  const start = async () => {
    unlockAudio();
    if (settings.desktopNotifications) void requestNotificationPermission();
    startSession({
      task: taskLabel || "Focus session",
      taskId: selectedTask?.id ?? null,
      subject: selectedTask?.subject ?? "General",
      durationMin: effectiveDuration,
      camera: useCamera,
    });
    if (useCamera && !camera.active) await camera.start();
  };

  const features = [
    settings.quizInterventions && "Recall Check quizzes",
    settings.smartBreaks && "Smart breaks",
    settings.tabTracking && "Tab-switch tracking",
    settings.autoPauseAway && "Auto-pause when away",
    settings.soundEnabled && "Sound alerts",
  ].filter(Boolean) as string[];

  return (
    <div className="card p-5 sm:p-7">
      <h2 className="text-lg font-semibold text-[var(--text)]">Plan your session</h2>
      <p className="mt-1 text-sm text-[var(--text-dim)]">Three quick choices, then StudyBro takes care of the rest.</p>

      {/* 1. Task */}
      <section className="mt-6">
        <StepLabel n={1} title="What are you working on?" />
        <div className="mt-3 flex flex-wrap gap-2">
          {openTasks.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTaskId(t.id); setCustom(""); }}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                taskId === t.id ? "border-[var(--brand)] bg-violet-500/12 text-[var(--text)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text)]",
              )}
            >
              {taskId === t.id && <Check size={14} className="shrink-0 text-[var(--brand-text)]" />}
              <span className="truncate">{t.title}</span>
              <span className="shrink-0 rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">{t.subject}</span>
            </button>
          ))}
        </div>
        <input
          value={custom}
          onChange={(e) => { setCustom(e.target.value); if (e.target.value) setTaskId(null); }}
          onFocus={() => setTaskId(null)}
          placeholder={openTasks.length ? "…or type something else" : "e.g. Chapter 4 — Neural networks"}
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
        />
      </section>

      {/* 2. Duration */}
      <section className="mt-6">
        <StepLabel n={2} title="How long?" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              onClick={() => { setDuration(d.value); setCustomMin(""); }}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                !customMin && duration === d.value ? "border-[var(--brand)] bg-violet-500/12" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
              )}
            >
              <p className="text-sm font-semibold text-[var(--text)]">{d.label}</p>
              <p className="text-[11px] text-[var(--text-faint)]">{d.hint}</p>
            </button>
          ))}
          <label className={cn("col-span-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 sm:col-span-1", customMin ? "border-[var(--brand)] bg-violet-500/12" : "border-[var(--border)] bg-[var(--surface)]")}>
            <input
              inputMode="numeric"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Custom"
              aria-label="Custom minutes"
              className="w-full bg-transparent text-sm font-semibold text-[var(--text)] outline-none placeholder:font-normal placeholder:text-[var(--text-faint)]"
            />
            <span className="text-[11px] text-[var(--text-faint)]">min</span>
          </label>
        </div>
      </section>

      {/* 3. Camera */}
      <section className="mt-6">
        <StepLabel n={3} title="AI camera monitoring" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <ChoiceCard
            active={useCamera}
            onClick={() => setUseCamera(true)}
            icon={<Camera size={18} />}
            title="Camera on"
            desc="Detects drowsiness, phone, look-aways and when you leave."
          />
          <ChoiceCard
            active={!useCamera}
            onClick={() => setUseCamera(false)}
            icon={<CameraOff size={18} />}
            title="Camera off"
            desc="Timer, tab tracking and coach only."
          />
        </div>
        {useCamera && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--good)]"><ShieldCheck size={13} /> Video is analysed on this device and never recorded or uploaded.</p>
        )}
      </section>

      <div className="mt-7 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span key={f} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text-dim)]">{f}</span>
          ))}
          <Link href="/settings" className="rounded-full px-2 py-1 text-[11px] text-[var(--brand-text)] hover:underline">Change</Link>
        </div>
        <button onClick={start} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--brand)] px-7 text-base font-semibold text-white shadow-lg shadow-violet-900/30 hover:brightness-110 active:scale-[0.98]">
          <Play size={18} fill="currentColor" /> Start session
        </button>
      </div>
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--surface-2)] text-xs text-[var(--text-dim)]">{n}</span>
      {title}
    </p>
  );
}

function ChoiceCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        active ? "border-[var(--brand)] bg-violet-500/12" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
      )}
    >
      <span className={cn("mt-0.5", active ? "text-[var(--brand-text)]" : "text-[var(--text-faint)]")}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-[var(--text)]">{title}</span>
        <span className="block text-xs text-[var(--text-dim)]">{desc}</span>
      </span>
    </button>
  );
}
