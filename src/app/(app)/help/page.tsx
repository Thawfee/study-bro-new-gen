import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help" };

const SECTIONS = [
  {
    title: "Getting started",
    items: [
      { q: "How do I start studying?", a: "Click “Start session” (top right, or Focus Session in the menu). Pick a task, a length and whether to use the camera, then press Start. When you finish, you get a session report with a grade and tips." },
      { q: "Do I need an account or internet?", a: "No account. Everything is saved in your browser. Internet is only needed the first time you turn on the camera, to download the AI models; after that they are cached." },
      { q: "Can I open Notes or Tasks during a session?", a: "Yes. The camera keeps monitoring in a small floating preview, and the timer keeps running. Click the preview or the timer pill to go back." },
    ],
  },
  {
    title: "Alerts",
    items: [
      { q: "What happens when I get distracted?", a: "StudyBro escalates gently: a soft nudge for a look-away or slouch; a Recall Check question if you look away twice within 3 minutes or get drowsy; an alarm only for closed eyes or a phone in view. Leaving your desk simply pauses the timer." },
      { q: "How do alarms stop?", a: "With the camera on, they stop by themselves the moment the camera sees your eyes open or the phone gone — no button to dismiss, so recovery time is real." },
      { q: "What counts as a tab switch?", a: "Leaving the StudyBro tab for more than 8 seconds during a session. You get a nudge when you return. You can turn this off in Settings." },
      { q: "Too many alerts?", a: "Settings → Camera AI sensitivity lets you make each detection wait longer. Settings → Alerts lets you change the gap between alerts or switch to nudges only." },
    ],
  },
  {
    title: "Coach & review",
    items: [
      { q: "Where do Recall Check questions come from?", a: "From your notes. Lines written as “Q: …” followed by “A: …” become flashcards. Without them, StudyBro makes fill-in-the-blank questions from your notes, or a quick mental-maths question." },
      { q: "How does Review work?", a: "Spaced repetition: cards you know come back after 1, 2, 4, 7, then 15 days; cards you miss come back in 10 minutes. Recall Checks in sessions update the same deck." },
      { q: "How is fatigue predicted?", a: "From time on task compared with your personal focus window (median minutes until your first lapse), recent lapses, eyes closing and your weaker hours. Every reason is shown with its points." },
    ],
  },
  {
    title: "Privacy",
    items: [
      { q: "Is my camera recorded?", a: "No. Frames are analysed in your browser and discarded. Nothing is uploaded. The camera turns off automatically when a session ends." },
      { q: "How do I back up or delete my data?", a: "Settings → Your data: Export downloads everything as a JSON file; Delete removes all StudyBro data from this browser." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Help</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">How StudyBro works, in plain words.</p>
      </div>
      {SECTIONS.map((s) => (
        <section key={s.title}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">{s.title}</h2>
          <div className="space-y-2">
            {s.items.map((it) => (
              <details key={it.q} className="card group p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--text)]">
                  {it.q}
                  <span className="text-lg leading-none text-[var(--text-faint)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">{it.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="text-center text-sm text-[var(--text-dim)]">Ready? <Link href="/focus" className="font-semibold text-[var(--brand-text)] hover:underline">Start a focus session →</Link></p>
    </div>
  );
}
