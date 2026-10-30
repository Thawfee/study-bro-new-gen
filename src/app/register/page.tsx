"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local demo — no real account is created. Enter the app.
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="p-5"><Link href="/"><Logo /></Link></div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--text)]">Join StudyBro AI 🚀</h1>
            <p className="mt-1 text-sm text-[var(--text-dim)]">Create your account and start focusing.</p>
          </div>
          <form onSubmit={submit} className="card space-y-4 p-6">
            <FieldGroup label="Name">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className="pl-9" />
              </div>
            </FieldGroup>
            <FieldGroup label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@studybro.ai" className="pl-9" />
              </div>
            </FieldGroup>
            <FieldGroup label="Password">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <Input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Create a password" className="pl-9" />
              </div>
            </FieldGroup>
            <Button className="w-full" type="submit">Create Account <ArrowRight size={16} /></Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--text-dim)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--brand-text)] hover:text-[var(--brand-text)]">Log in</Link>
          </p>
          <p className="mt-4 text-center text-[11px] text-[var(--text-faint)]">
            Demo build — accounts are local only. No data is sent to a server.
          </p>
        </div>
      </div>
    </div>
  );
}
