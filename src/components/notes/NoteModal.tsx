"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Textarea, Select } from "@/components/ui/Field";
import { NOTE_CATEGORIES, type Note, type NoteCategory } from "@/types/notes";

export function NoteModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; body: string; category: NoteCategory }) => void;
  onDelete?: () => void;
  initial?: Note | null;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NoteCategory>("General");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setBody(initial?.body ?? "");
      setCategory(initial?.category ?? "General");
    }
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), body: body.trim(), category });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Note" : "New Note"}>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <FieldGroup label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" autoFocus />
          </FieldGroup>
          <FieldGroup label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
              {NOTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup label="Note">
          <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write it down, Bro…" />
        </FieldGroup>
        <div className="flex items-center justify-between pt-1">
          {initial && onDelete ? (
            <Button variant="danger" icon={Trash2} onClick={() => { onDelete(); onClose(); }}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{initial ? "Save" : "Add Note"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
