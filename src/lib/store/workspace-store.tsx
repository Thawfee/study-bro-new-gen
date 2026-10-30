"use client";

/* ============================================================
   Workspace store — tasks, goals, notes, profile.
   Local-first (localStorage) persistence. Structured so a real
   PostgreSQL + Prisma backend can replace the persistence layer
   later without touching the UI. Seeded with sample data so the
   product feels alive; every list still handles the empty state.
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Task, Priority } from "@/types/tasks";
import type { Goal, GoalPeriod } from "@/types/goals";
import type { Note, NoteCategory } from "@/types/notes";
import type { Profile } from "@/types/user";
import { uid } from "@/lib/utils";

const KEY = "studybro.workspace.v1";

interface WorkspaceData {
  tasks: Task[];
  goals: Goal[];
  notes: Note[];
  profile: Profile;
}

function seed(): WorkspaceData {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(now + 864e5).toISOString().slice(0, 10);
  return {
    profile: {
      name: "Study Bro",
      email: "you@studybro.ai",
      bio: "Locked in and leveling up. 🔥",
      avatarSeed: "studybro",
      joinedAt: now - 12 * 864e5,
      streakDays: 5,
      totalStudyMs: 41 * 3600e3,
      bestFocusScore: 96,
    },
    tasks: [
      { id: uid("t"), title: "Finish Machine Learning chapter 4", subject: "AI/ML", priority: "high", dueDate: today, done: false, createdAt: now },
      { id: uid("t"), title: "Solve 10 Python problems", subject: "Python", priority: "medium", dueDate: today, done: false, createdAt: now },
      { id: uid("t"), title: "Review DBMS notes", subject: "College", priority: "low", dueDate: tomorrow, done: false, createdAt: now },
      { id: uid("t"), title: "Set up project repo", subject: "Projects", priority: "medium", dueDate: null, done: true, createdAt: now - 864e5 },
    ],
    goals: [
      { id: uid("g"), title: "Study Python", period: "daily", unit: "hours", current: 1.5, target: 2, createdAt: now },
      { id: uid("g"), title: "Deep work sessions", period: "weekly", unit: "sessions", current: 4, target: 10, createdAt: now },
      { id: uid("g"), title: "Finish ML course", period: "monthly", unit: "chapters", current: 3, target: 8, createdAt: now },
    ],
    notes: [
      { id: uid("n"), title: "Gradient Descent", body: "Iteratively move params in the negative gradient direction. Learning rate controls step size — too big overshoots, too small is slow.", category: "AI/ML", createdAt: now, updatedAt: now },
      { id: uid("n"), title: "Python list comprehensions", body: "[expr for item in iterable if cond] — concise, faster than manual loops for building lists.", category: "Python", createdAt: now - 3600e3, updatedAt: now - 3600e3 },
      { id: uid("n"), title: "Quick revision Q&A", body: "Q: Which Python keyword creates a generator?\nA: yield\nQ: What does a learning rate control?\nA: Step size of each update\nQ: Which SQL clause filters grouped rows?\nA: HAVING\nQ: What is overfitting?\nA: Memorising training data instead of generalising", category: "General", createdAt: now - 1800e3, updatedAt: now - 1800e3 },
      { id: uid("n"), title: "Expo demo checklist", body: "1. Open dashboard 2. Start focus session 3. Show phone detection 4. Show drowsiness alert 5. Analytics.", category: "Projects", createdAt: now - 7200e3, updatedAt: now - 7200e3 },
    ],
  };
}

interface WorkspaceContextValue extends WorkspaceData {
  loaded: boolean;
  // tasks
  addTask: (t: Omit<Task, "id" | "createdAt" | "done">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  // goals
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  // notes
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  // profile
  updateProfile: (patch: Partial<Profile>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => seed());
  const [loaded, setLoaded] = useState(false);

  // hydrate from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WorkspaceData>;
        setData((d) => ({
          tasks: parsed.tasks ?? d.tasks,
          goals: parsed.goals ?? d.goals,
          notes: parsed.notes ?? d.notes,
          profile: { ...d.profile, ...parsed.profile },
        }));
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // persist
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, loaded]);

  const addTask = useCallback((t: Omit<Task, "id" | "createdAt" | "done">) => {
    setData((d) => ({ ...d, tasks: [{ ...t, id: uid("t"), createdAt: Date.now(), done: false }, ...d.tasks] }));
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);
  const toggleTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt">) => {
    setData((d) => ({ ...d, goals: [{ ...g, id: uid("g"), createdAt: Date.now() }, ...d.goals] }));
  }, []);
  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setData((d) => ({ ...d, goals: d.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);
  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== id) }));
  }, []);

  const addNote = useCallback((n: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const note: Note = { ...n, id: uid("n"), createdAt: Date.now(), updatedAt: Date.now() };
    setData((d) => ({ ...d, notes: [note, ...d.notes] }));
    return note;
  }, []);
  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setData((d) => ({ ...d, notes: d.notes.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)) }));
  }, []);
  const deleteNote = useCallback((id: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((x) => x.id !== id) }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...data,
      loaded,
      addTask, updateTask, toggleTask, deleteTask,
      addGoal, updateGoal, deleteGoal,
      addNote, updateNote, deleteNote,
      updateProfile,
    }),
    [data, loaded, addTask, updateTask, toggleTask, deleteTask, addGoal, updateGoal, deleteGoal, addNote, updateNote, deleteNote, updateProfile],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
}

export type { Priority, GoalPeriod, NoteCategory };
