"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import type { Goal, GoalPeriod } from "@/types/goals";

export function GoalModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; period: GoalPeriod; unit: string; target: number; current: number }) => void;
  initial?: Goal | null;
}) {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("daily");
  const [unit, setUnit] = useState("hours");
  const [target, setTarget] = useState(2);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setPeriod(initial?.period ?? "daily");
      setUnit(initial?.unit ?? "hours");
      setTarget(initial?.target ?? 2);
    }
  }, [open, initial]);

  const submit = () => {
    if (!title.trim() || target <= 0) return;
    onSave({ title: title.trim(), period, unit: unit.trim() || "units", target, current: initial?.current ?? 0 });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Goal" : "New Goal"}>
      <div className="space-y-4">
        <FieldGroup label="Goal">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study Python" autoFocus />
        </FieldGroup>
        <FieldGroup label="Period">
          <Select value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Target">
            <Input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="hours, tasks…" />
          </FieldGroup>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save" : "Add Goal"}</Button>
        </div>
      </div>
    </Modal>
  );
}
