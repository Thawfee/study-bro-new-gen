import Link from "next/link";
import { Home, Compass } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" />
      <div className="mt-10">
        <p className="text-7xl font-bold gradient-text">404</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--text)]">Lost the plot, Bro?</h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-dim)]">
          This page wandered off — probably got distracted. Let&apos;s get you back on task.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:brightness-110">
          <Home size={16} /> Back home
        </Link>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">
          <Compass size={16} /> Go to dashboard
        </Link>
      </div>
    </div>
  );
}
