export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  /** ISO date string (yyyy-mm-dd) or null. */
  dueDate: string | null;
  done: boolean;
  createdAt: number;
}
