import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Focus Monitor", href: "/focus" },
      { label: "Analytics", href: "/analytics" },
      { label: "Achievements", href: "/achievements" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#how" },
      { label: "Help", href: "/help" },
      { label: "Contact", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-[var(--text-dim)]">
              Your AI Study Bro. Study smarter, stay focused, finish stronger.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-faint)] sm:flex-row">
          <p>© 2026 StudyBro AI. All rights reserved.</p>
          <p>Built for the project expo · Privacy-first by design.</p>
        </div>
      </div>
    </footer>
  );
}
