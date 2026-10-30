"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import type { Task, Priority } from "@/types/tasks";

const SUBJECTS = ["Python", "AI/ML", "College", "Projects", "General"];

export function TaskModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; subject: string; priority: Priority; dueDate: string | null }) => void;
  initial?: Task | null;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setSubject(initial?.subject ?? "General");
      setPriority(initial?.priority ?? "medium");
      setDueDate(initial?.dueDate ?? "");
    }
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), subject, priority, dueDate: dueDate || null });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Task" : "New Task"}>
      <div className="space-y-4">
        <FieldGroup label="Task">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish ML chapter 4" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Subject">
            <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save" : "Add Task"}</Button>
        </div>
      </div>
    </Modal>
  );
}
