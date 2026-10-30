import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS: { h: string; p: string[] }[] = [
  { h: "Camera & focus analysis", p: [
    "StudyBro AI uses your camera only for focus analysis. When you enable the Focus Monitor, video frames are processed in real time, in your browser, to detect focus-related behaviors (drowsiness, phone usage, distraction, posture, presence).",
    "No recordings are stored by default. Frames are analyzed in the moment and discarded — they are never uploaded to a server in this build.",
  ]},
  { h: "On-device processing", p: [
    "All computer-vision detection runs locally using in-browser models (MediaPipe Face Landmarker and TensorFlow.js COCO-SSD). Your camera feed does not leave your device.",
  ]},
  { h: "Local data", p: [
    "Your tasks, goals, notes, profile and settings are saved in your browser's local storage on your device. They are not synced to a server in this build. Clearing your browser data (or using Settings → Reset local data) removes them permanently.",
  ]},
  { h: "Your controls", p: [
    "You control camera access (grant or deny it in your browser, and stop the camera any time), AI monitoring (enable/disable on the Focus Monitor), alerts and sounds (Settings → Video Alerts) and notifications (Settings).",
  ]},
  { h: "Future backend", p: [
    "A future version may connect an optional Python backend for heavier models. If and when that happens, any change to where processing occurs will be clearly disclosed and opt-in.",
  ]},
];

export default function PrivacyPage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--text-faint)]">Last updated: 2026 · Privacy-first by design.</p>
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
