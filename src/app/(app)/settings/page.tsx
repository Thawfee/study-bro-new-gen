"use client";

import { Bell, Download, GraduationCap, Palette, ScanFace, Timer, Trash2, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { Toggle } from "@/components/ui/Toggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { chime, configureSound, requestNotificationPermission, unlockAudio } from "@/lib/sound";
import { DEFAULT_SETTINGS } from "@/lib/alerts/interventions";
import { cn } from "@/lib/utils";

function Section({ icon: Icon, title, desc, children }: { icon: LucideIcon; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-2 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--brand-text)]"><Icon size={17} /></span>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <p className="text-xs text-[var(--text-dim)]">{desc}</p>
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </section>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        {desc && <p className="text-xs text-[var(--text-dim)]">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { label: string; value: T }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors", value === o.value ? "bg-[var(--brand)] text-white" : "text-[var(--text-dim)] hover:text-[var(--text)]")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Seconds({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <label className="flex items-center gap-3">
      <input type="range" min={min} max={max} step={500} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} className="w-40 accent-[var(--brand)]" />
      <span className="w-12 text-right text-xs font-semibold tabular-nums text-[var(--text)]">{(value / 1000).toFixed(1)}s</span>
    </label>
  );
}

const STORAGE_PREFIX = "studybro.";

export default function SettingsPage() {
  const { settings: s, updateSettings: set } = useStudyBro();

  const exportData = () => {
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: "StudyBro AI" };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) out[k] = JSON.parse(localStorage.getItem(k) ?? "null");
      }
    } catch { /* storage blocked */ }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `studybro-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetData = () => {
    if (!confirm("Delete all StudyBro data on this device (sessions, notes, tasks, cards, XP, settings)? This cannot be undone.")) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    location.reload();
  };

  const testSound = () => {
    unlockAudio();
    configureSound({ volume: s.volume, enabled: true });
    chime("alert");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">Everything is saved on this device automatically.</p>
      </div>

      <Section icon={Timer} title="Focus sessions" desc="Defaults for new sessions.">
        <Row title="Default length">
          <Segmented value={s.defaultDurationMin} onChange={(v) => set({ defaultDurationMin: v })} options={[{ label: "25 min", value: 25 }, { label: "50 min", value: 50 }, { label: "90 min", value: 90 }, { label: "No limit", value: 0 }]} />
        </Row>
        <Row title="Camera on by default" desc="Use AI monitoring unless you switch it off.">
          <Toggle checked={s.cameraByDefault} onChange={(v) => set({ cameraByDefault: v })} label="Camera on by default" />
        </Row>
        <Row title="Auto-pause when you leave" desc="The timer pauses when the camera can't see you, and resumes when you return.">
          <Toggle checked={s.autoPauseAway} onChange={(v) => set({ autoPauseAway: v })} label="Auto-pause when away" />
        </Row>
        <Row title="Track tab switches" desc="Leaving the StudyBro tab for 8s+ counts as a digital distraction.">
          <Toggle checked={s.tabTracking} onChange={(v) => set({ tabTracking: v })} label="Track tab switches" />
        </Row>
      </Section>

      <Section icon={Volume2} title="Alerts & sound" desc="Gentle nudges first; alarms only when needed.">
        <Row title="Blocking alerts" desc="Wake-up, phone-down and Recall Check screens. Off = nudges only.">
          <Toggle checked={s.interventionsEnabled} onChange={(v) => set({ interventionsEnabled: v })} label="Blocking alerts" />
        </Row>
        <Row title="Sound" desc="Synthesised chimes and alarms — no media files.">
          <Toggle checked={s.soundEnabled} onChange={(v) => set({ soundEnabled: v })} label="Sound" />
        </Row>
        <Row title="Volume">
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={100} value={s.volume} onChange={(e) => set({ volume: Number(e.target.value) })} aria-label="Volume" className="w-40 accent-[var(--brand)]" />
            <button onClick={testSound} className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-dim)] hover:text-[var(--text)]">Test</button>
          </div>
        </Row>
        <Row title="Gap between alerts" desc="Minimum time before the same alert can block you again.">
          <Segmented value={s.cooldownMs} onChange={(v) => set({ cooldownMs: v })} options={[{ label: "15s", value: 15_000 }, { label: "30s", value: 30_000 }, { label: "60s", value: 60_000 }, { label: "2 min", value: 120_000 }]} />
        </Row>
        <Row title="Desktop notifications" desc="Get notified if an alert fires while you're on another tab.">
          <Toggle
            checked={s.desktopNotifications}
            onChange={async (v) => set({ desktopNotifications: v ? await requestNotificationPermission() : false })}
            label="Desktop notifications"
          />
        </Row>
      </Section>

      <Section icon={GraduationCap} title="AI coach" desc="Coach-style help instead of punishment.">
        <Row title="Recall Check" desc="Drowsiness — or a second look-away within 3 min — asks one question from your notes.">
          <Toggle checked={s.quizInterventions} onChange={(v) => set({ quizInterventions: v })} label="Recall Check" />
        </Row>
        <Row title="Smart breaks" desc="Suggest a break when predicted fatigue risk reaches 70%.">
          <Toggle checked={s.smartBreaks} onChange={(v) => set({ smartBreaks: v })} label="Smart breaks" />
        </Row>
        <Row title="Break length">
          <Segmented value={s.breakMinutes} onChange={(v) => set({ breakMinutes: v })} options={[{ label: "3 min", value: 3 }, { label: "5 min", value: 5 }, { label: "10 min", value: 10 }]} />
        </Row>
        <Row title="Stuck detection (experimental)" desc="A furrowed brow for ~7s while reading offers to save a doubt.">
          <Toggle checked={s.confusionHelp} onChange={(v) => set({ confusionHelp: v })} label="Stuck detection" />
        </Row>
      </Section>

      <Section icon={ScanFace} title="Camera AI sensitivity" desc="How long a behaviour must last before StudyBro reacts. Longer = fewer false alarms.">
        <Row title="Eyes closed"><Seconds label="Eyes closed" value={s.drowsinessThresholdMs} min={5200} max={10000} onChange={(v) => set({ drowsinessThresholdMs: v })} /></Row>
        <Row title="Looking away"><Seconds label="Looking away" value={s.distractionThresholdMs} min={3200} max={8000} onChange={(v) => set({ distractionThresholdMs: v })} /></Row>
        <Row title="Phone in view"><Seconds label="Phone in view" value={s.phoneThresholdMs} min={1900} max={8000} onChange={(v) => set({ phoneThresholdMs: v })} /></Row>
        <Row title="Away from desk"><Seconds label="Away from desk" value={s.awayThresholdMs} min={6000} max={12000} onChange={(v) => set({ awayThresholdMs: v })} /></Row>
        <Row title="Posture"><Seconds label="Posture" value={s.postureThresholdMs} min={4500} max={8000} onChange={(v) => set({ postureThresholdMs: v })} /></Row>
        <Row title="Show face landmarks" desc="Draw the eye/brow overlay on the camera.">
          <Toggle checked={s.showLandmarks} onChange={(v) => set({ showLandmarks: v })} label="Show face landmarks" />
        </Row>
        <Row title="Restore recommended values">
          <button
            onClick={() => set({
              drowsinessThresholdMs: DEFAULT_SETTINGS.drowsinessThresholdMs,
              distractionThresholdMs: DEFAULT_SETTINGS.distractionThresholdMs,
              phoneThresholdMs: DEFAULT_SETTINGS.phoneThresholdMs,
              awayThresholdMs: DEFAULT_SETTINGS.awayThresholdMs,
              postureThresholdMs: DEFAULT_SETTINGS.postureThresholdMs,
            })}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            Reset sensitivity
          </button>
        </Row>
      </Section>

      <Section icon={Palette} title="Appearance" desc="Choose how StudyBro looks.">
        <Row title="Theme"><ThemeToggle /></Row>
      </Section>

      <Section icon={Bell} title="Your data" desc="Stored only in this browser. Nothing is uploaded.">
        <Row title="Export data" desc="Download sessions, notes, tasks, cards and settings as JSON.">
          <button onClick={exportData} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"><Download size={13} /> Export</button>
        </Row>
        <Row title="Delete all data" desc="Removes everything StudyBro saved on this device.">
          <button onClick={resetData} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-[var(--bad)]"><Trash2 size={13} /> Delete</button>
        </Row>
      </Section>
    </div>
  );
}
