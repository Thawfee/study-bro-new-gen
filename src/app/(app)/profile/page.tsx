"use client";

import { useState } from "react";
import { Pencil, Flame, Clock, Gauge, CalendarDays } from "lucide-react";
import { useStudyBro } from "@/lib/store/studybro-store";
import { useWorkspace } from "@/lib/store/workspace-store";
import { PageHeader } from "@/components/ui/common";
import { Avatar } from "@/components/ui/common";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { formatDuration } from "@/lib/utils";
import { dayStreak, levelFromXp } from "@/lib/coach/rewards";
import { realSessions } from "@/lib/insights";

export default function ProfilePage() {
  const { profile, updateProfile } = useWorkspace();
  const { history, progress } = useStudyBro();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [bio, setBio] = useState(profile.bio);

  const openEdit = () => {
    setName(profile.name); setEmail(profile.email); setBio(profile.bio);
    setOpen(true);
  };
  const save = () => { updateProfile({ name, email, bio }); setOpen(false); };

  const joined = new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // Real numbers from saved sessions (no sample values).
  const sessions = realSessions(history);
  const total = sessions.reduce((a, s) => a + s.studyMs, 0);
  const lvl = levelFromXp(progress.xp);
  const stats = [
    { icon: Flame, label: "Day streak", value: `${dayStreak(progress.studyDays)} days`, tone: "text-[var(--warn)]" },
    { icon: Clock, label: "Total study time", value: total ? formatDuration(total) : "0m", tone: "text-[var(--brand-text)]" },
    { icon: Gauge, label: "Sessions", value: `${sessions.length}`, tone: "text-[var(--accent)]" },
    { icon: Gauge, label: `Level ${lvl.level}`, value: lvl.name, tone: "text-[var(--good)]" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your study identity." />

      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-cyan-500/20" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-[var(--bg-elev)]">
                <Avatar name={profile.name} seed={profile.avatarSeed} size={80} />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-[var(--text)]">{profile.name}</h2>
                <p className="text-sm text-[var(--text-dim)]">{profile.email}</p>
              </div>
            </div>
            <Button variant="secondary" icon={Pencil} onClick={openEdit}>Edit Profile</Button>
          </div>
          {profile.bio && <p className="mt-4 max-w-xl text-sm text-[var(--text-dim)]">{profile.bio}</p>}
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
            <CalendarDays size={13} /> Joined {joined}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <Icon size={18} className={s.tone} />
              <p className="mt-3 text-2xl font-bold text-[var(--text)]">{s.value}</p>
              <p className="mt-1 text-xs text-[var(--text-faint)]">{s.label}</p>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <FieldGroup label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></FieldGroup>
          <FieldGroup label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FieldGroup>
          <FieldGroup label="Bio"><Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Say something motivational, Bro." /></FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
