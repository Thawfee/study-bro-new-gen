export interface Profile {
  name: string;
  email: string;
  bio: string;
  /** Seed for the generated avatar gradient. */
  avatarSeed: string;
  joinedAt: number;
  streakDays: number;
  totalStudyMs: number;
  bestFocusScore: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** Progress 0..1 toward unlocking (1 = unlocked). */
  progress: number;
  unlocked: boolean;
}
