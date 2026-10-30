export type GoalPeriod = "daily" | "weekly" | "monthly";

export interface Goal {
  id: string;
  title: string;
  period: GoalPeriod;
  /** Unit label, e.g. "hours", "tasks", "chapters". */
  unit: string;
  current: number;
  target: number;
  createdAt: number;
}
