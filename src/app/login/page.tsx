"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local demo — no real authentication. Enter the app.
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="p-5"><Link href="/"><Logo /></Link></div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--text)]">Welcome back, Bro 👋</h1>
            <p className="mt-1 text-sm text-[var(--text-dim)]">Log in to keep your streak alive.</p>
          </div>
          <form onSubmit={submit} className="card space-y-4 p-6">
            <FieldGroup label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studybro.ai" className="pl-9" />
              </div>
            </FieldGroup>
            <FieldGroup label="Password">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
              </div>
            </FieldGroup>
            <Button className="w-full" type="submit">Log In <ArrowRight size={16} /></Button>
            <Button href="/dashboard" variant="secondary" className="w-full">Continue as guest</Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--text-dim)]">
            New here?{" "}
            <Link href="/register" className="font-medium text-[var(--brand-text)] hover:text-[var(--brand-text)]">Create an account</Link>
          </p>
          <p className="mt-4 text-center text-[11px] text-[var(--text-faint)]">
            Demo build — authentication is local only. No credentials are sent anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
