import Link from "next/link";
import {
  Brain, Smartphone, Eye, Armchair, UserRound, Timer, CheckSquare, NotebookPen,
  BarChart3, Trophy, Target, Moon, ArrowRight, Sparkles, Lock, Camera, Cpu, Play,
  ShieldCheck, type LucideIcon,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/brand/Logo";

function stagger(i: number): React.CSSProperties {
  return { "--i": i } as React.CSSProperties;
}

const FEATURES: { icon: LucideIcon; emoji: string; title: string; desc: string; tone: string }[] = [
  { icon: Brain, emoji: "🤖", title: "AI focus sessions", desc: "On-device computer vision spots drowsiness, phone use, look-aways, slouching and when you leave your desk.", tone: "text-[var(--brand-text)]" },
  { icon: Sparkles, emoji: "🧠", title: "Recall Check", desc: "Drifting? Answer one question from your own notes. The alert doubles as revision.", tone: "text-[var(--accent)]" },
  { icon: Moon, emoji: "🧘", title: "Fatigue prediction", desc: "Learns your personal focus window and suggests a break before you crash.", tone: "text-[var(--good)]" },
  { icon: NotebookPen, emoji: "🃏", title: "Spaced-repetition review", desc: "Q/A lines in your notes become flashcards that come back right before you forget.", tone: "text-[var(--accent)]" },
  { icon: BarChart3, emoji: "📊", title: "Session reports", desc: "A grade, what distracted you, and personal tips after every session.", tone: "text-[var(--brand-text)]" },
  { icon: CheckSquare, emoji: "✅", title: "Tasks, goals & notes", desc: "Plan your day and start a session straight from a task.", tone: "text-[var(--warn)]" },
  { icon: Trophy, emoji: "🔥", title: "Streaks & XP", desc: "Focus streaks, levels and badges reward real focus — not just screen time.", tone: "text-[var(--warn)]" },
];

const STEPS = [
  { n: "1", title: "Plan a session", desc: "Pick a task and a length — 25, 50 or 90 min." },
  { n: "2", title: "Allow camera monitoring", desc: "Optional on-device camera — nothing is recorded." },
  { n: "3", title: "AI watches your focus", desc: "Face, eyes, phone and posture, in real time." },
  { n: "4", title: "StudyBro steps in", desc: "Nudge → recall question → alarm, only as needed." },
  { n: "5", title: "Get your report", desc: "A grade, insights and tips for next time." },
];

const DETECTIONS = [
  { emoji: "😴", label: "Drowsiness" }, { emoji: "📱", label: "Phone use" },
  { emoji: "👀", label: "Distraction" }, { emoji: "🪑", label: "Posture" }, { emoji: "🚶", label: "Presence" },
];



const FAQ = [
  { q: "Is my camera footage stored anywhere?", a: "No. When you enable the camera, detection runs entirely in your browser. No frames are uploaded or recorded by default." },
  { q: "Do I need a special GPU or backend?", a: "No. Phone detection (COCO-SSD) and face/eye tracking (MediaPipe) run on-device. A future Python backend is optional for heavier models." },
  { q: "Can I use it without a camera?", a: "Yes. The timer, tab-switch tracking, Recall Checks, review and reports all work without it. Demo tools can simulate detections for presentations." },
  { q: "Is StudyBro free?", a: "This is a student project build — fully usable and local-first. It's structured to grow into a real product later." },
];

export default function LandingPage() {
  return (
    <div className="relative">
      <PublicNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="stagger">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-[var(--brand-text)]" style={stagger(0)}>
              <Sparkles size={13} /> Your AI Study Guardian
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--text)] sm:text-6xl" style={stagger(1)}>
              Focus deeper with an <span className="gradient-text">AI Study Guardian.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[var(--text-dim)]" style={stagger(2)}>
              StudyBro combines live computer-vision signals into an explainable Focus State, intervenes when focus is genuinely lost, and measures how quickly you recover.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3" style={stagger(3)}>
              <Link href="/focus" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition-transform hover:scale-[1.03]">
                <Play size={16} /> Start a Focus Session
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]">
                See How It Works
              </a>
            </div>
            <p className="mt-5 text-xs text-[var(--text-faint)]" style={stagger(4)}>
              AI-powered focus monitoring • Smart study tools • Privacy-first
            </p>
          </div>
          <HeroMock />
        </div>

        {/* Benefits strip */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Brain, label: "On-device AI" },
            { icon: Lock, label: "Privacy-first" },
            { icon: Timer, label: "Focus tools" },
            { icon: Trophy, label: "Habit building" },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <Icon size={18} className="text-[var(--brand-text)]" />
                <span className="text-sm font-medium text-[var(--text)]">{b.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Everything you need" title="One study companion, seven superpowers" subtitle="From computer-vision focus monitoring to notes and streaks — it all lives in one place." />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card group relative overflow-hidden p-5">
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] ${f.tone}`}>
                      <Icon size={20} />
                    </span>
                    <span className="text-2xl">{f.emoji}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--text)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-dim)]">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Focus Monitoring highlight */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card grid gap-8 overflow-hidden p-8 lg:grid-cols-2 lg:items-center sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
              <Brain size={13} /> Real computer vision
            </span>
            <h2 className="mt-4 text-2xl font-bold text-[var(--text)] sm:text-3xl">AI that actually watches your focus</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-dim)]">
              StudyBro uses your webcam to detect five behaviors in real time — and intervenes with a
              friendly nudge, a quick recall question or an alarm only when it's really needed. It runs on-device, so your face never leaves your machine.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {DETECTIONS.map((d) => (
                <span key={d.label} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                  <span>{d.emoji}</span> {d.label}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--good)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> AI Monitoring Active
              </span>
              <span className="text-[11px] text-[var(--text-faint)]">24 FPS</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: "Face", v: "Detected 98.7%", tone: "text-[var(--good)]" },
                { k: "Eyes", v: "Open · EAR 0.31", tone: "text-[var(--good)]" },
                { k: "Phone", v: "Detected 94%", tone: "text-[var(--bad)]" },
                { k: "Posture", v: "Good", tone: "text-[var(--good)]" },
              ].map((r) => (
                <div key={r.k} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{r.k}</p>
                  <p className={`text-sm font-semibold ${r.tone}`}>{r.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="How it works" title="From camera to comeback in seconds" subtitle="A simple loop that keeps you honest and on task." />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25">{s.n}</span>
              <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-dim)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What makes StudyBro different */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="The integrated approach" title="Detect → understand → intervene → measure" subtitle="StudyBro is designed as a complete focus loop, not a single webcam detector." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="card p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Traditional timer</p><h3 className="mt-3 text-lg font-semibold text-[var(--text)]">Tracks elapsed time</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">Useful for structure, but it does not know whether the student is actually focused.</p></div>
          <div className="card p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Typical productivity app</p><h3 className="mt-3 text-lg font-semibold text-[var(--text)]">Tracks tasks and goals</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">Useful for planning, but session behavior is usually invisible.</p></div>
          <div className="card border-violet-400/25 p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">StudyBro AI</p><h3 className="mt-3 text-lg font-semibold text-[var(--text)]">Understands the study state</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">Combines face, eyes, gaze, phone, posture and presence; explains why the state changed; intervenes; then measures recovery.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/expo" className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-[var(--warn)]">Open Expo Mode</Link><Link href="/lab" className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-[var(--accent)]">Open AI Test Lab</Link></div></div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card grid gap-8 overflow-hidden p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[var(--good)]">
              <Lock size={13} /> Privacy first
            </span>
            <h2 className="mt-4 text-2xl font-bold text-[var(--text)] sm:text-3xl">Your camera stays yours</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
              StudyBro uses your camera only for focus analysis. No recordings are stored by default —
              frames are analyzed in the moment and discarded. Everything runs locally in your browser.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: Camera, text: "On-device camera — no uploads" },
              { icon: ShieldCheck, text: "No recordings saved by default" },
              { icon: Cpu, text: "Detection runs locally, ready for edge AI" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-[var(--good)]"><Icon size={17} /></span>
                  <span className="text-sm text-[var(--text)]">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Good questions, straight answers" subtitle="" />
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[var(--text)]">
                {f.q}
                <span className="text-[var(--text-faint)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card flex flex-col items-center gap-5 p-10 text-center">
          <Logo size="lg" withText={false} />
          <h2 className="max-w-xl text-2xl font-bold text-[var(--text)] sm:text-3xl">Ready to lock in, Bro?</h2>
          <p className="max-w-md text-sm text-[var(--text-dim)]">Study smarter. Stay focused. Finish stronger. Your AI study bro is one click away.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition-transform hover:scale-[1.03]">
            Launch StudyBro <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-text)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-[var(--text-dim)]">{subtitle}</p>}
    </div>
  );
}

function HeroMock() {
  const chips = [
    { emoji: "😴", label: "Drowsiness", status: "Normal", tone: "text-[var(--good)] border-emerald-400/30 bg-emerald-500/10" },
    { emoji: "📱", label: "Phone", status: "Detected", tone: "text-[var(--bad)] border-rose-400/30 bg-rose-500/10" },
    { emoji: "👀", label: "Gaze", status: "Focused", tone: "text-[var(--good)] border-emerald-400/30 bg-emerald-500/10" },
    { emoji: "🪑", label: "Posture", status: "Good", tone: "text-[var(--good)] border-emerald-400/30 bg-emerald-500/10" },
  ];
  const score = 87, size = 150, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r, offset = c - (score / 100) * c;
  return (
    <div className="glass-strong animate-float relative rounded-2xl p-5 shadow-2xl">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Illustrative UI preview · example values</div>
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--good)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> AI Monitoring Active
        </span>
        <Moon size={16} className="text-[var(--text-faint)]" />
      </div>
      <div className="flex items-center gap-5">
        <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#8b5cf6" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ filter: "drop-shadow(0 0 6px #8b5cf666)" }} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold text-[var(--text)]">{score}</span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Focus</span>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {chips.map((chip) => (
            <div key={chip.label} className={`rounded-xl border px-2.5 py-2 ${chip.tone}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]"><span>{chip.emoji}</span> {chip.label}</div>
              <div className="mt-0.5 text-[11px] opacity-90">{chip.status}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-3">
        <p className="text-[11px] font-medium text-[var(--text-dim)]">Recent AI event</p>
        <p className="mt-1 text-sm text-[var(--text)]">📱 Phone detected · focus score −10</p>
      </div>
    </div>
  );
}
