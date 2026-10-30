import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS: { h: string; p: string[] }[] = [
  { h: "Acceptance of terms", p: [
    "StudyBro AI is a student project provided for educational and demonstration purposes. By using it, you agree to these terms.",
  ]},
  { h: "Use of the app", p: [
    "You may use StudyBro AI for personal study and productivity. Don't misuse the app, attempt to disrupt it, or use it for anything unlawful.",
  ]},
  { h: "AI detections", p: [
    "Focus detections are AI estimations and may be imperfect. They are meant to nudge and support your study habits — not as medical, safety, or professional advice. Don't rely on them for anything critical.",
  ]},
  { h: "No warranty", p: [
    "The app is provided “as is”, without warranties of any kind. To the fullest extent permitted by law, the authors are not liable for any damages arising from its use.",
  ]},
  { h: "Content", p: [
    "You are responsible for the tasks, goals and notes you create. This build stores them locally in your browser.",
  ]},
  { h: "Changes", p: [
    "These terms may be updated as the project evolves. Continued use after changes constitutes acceptance of the updated terms.",
  ]},
];

export default function TermsPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--text-faint)]">Last updated: 2026</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-[var(--text)]">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">{para}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
