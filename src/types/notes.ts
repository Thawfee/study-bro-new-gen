export type NoteCategory = "Python" | "AI/ML" | "College" | "Projects" | "General";

export const NOTE_CATEGORIES: NoteCategory[] = ["Python", "AI/ML", "College", "Projects", "General"];

export interface Note {
  id: string;
  title: string;
  body: string;
  category: NoteCategory;
  createdAt: number;
  updatedAt: number;
}
