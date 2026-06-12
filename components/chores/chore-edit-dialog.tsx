"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export type ChoreDialogInitial = {
  id: string;
  title: string;
  icon: string;
  points: number;
};

type Props = {
  open: boolean;
  mode: "add" | "edit";
  initial?: ChoreDialogInitial;
  onSave: (payload: { title: string; icon: string; points: number }) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onClose: () => void;
};

export function ChoreEditDialog({ open, mode, initial, onSave, onDelete, onClose }: Props) {
  const t = useTranslations("chores");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setIcon(initial?.icon ?? "");
    setPointsInput(initial ? String(initial.points) : "");
    setConfirmingDelete(false);
    setSubmitting(false);
  }, [open, initial]);

  if (!open) return null;

  const pointsNumber = Number(pointsInput);
  const fieldsValid =
    title.trim() !== "" &&
    icon.trim() !== "" &&
    pointsInput.trim() !== "" &&
    Number.isInteger(pointsNumber) &&
    pointsNumber >= 0;
  const isDirty =
    mode === "add" ||
    !initial ||
    title.trim() !== initial.title.trim() ||
    icon.trim() !== initial.icon.trim() ||
    pointsNumber !== initial.points;

  const handleSave = async () => {
    if (!fieldsValid || !isDirty || submitting) return;
    setSubmitting(true);
    const ok = await onSave({ title: title.trim(), icon: icon.trim(), points: pointsNumber });
    setSubmitting(false);
    if (ok) onClose();
  };

  const handleDelete = async () => {
    if (!onDelete || submitting) return;
    setSubmitting(true);
    const ok = await onDelete();
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">
            {mode === "add" ? t("choreEdit.addChore") : t("choreEdit.editChore")}
          </h2>
          {mode === "edit" && onDelete && !confirmingDelete ? (
            <Button
              size="sm"
              variant="outline"
              disabled={submitting}
              onClick={() => setConfirmingDelete(true)}
              className="text-destructive hover:text-destructive"
            >
              {t("choreEdit.delete")}
            </Button>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("choreEdit.title")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              placeholder=""
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("choreEdit.icon")}
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={8}
              className="w-24 rounded border bg-background px-3 py-2 text-2xl"
              placeholder="🐕"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("choreEdit.points")}
            </label>
            <input
              type="number"
              step="1"
              min="0"
              inputMode="numeric"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              className="w-24 rounded border bg-background px-3 py-2 text-sm tabular-nums"
            />
          </div>
        </div>

        {confirmingDelete ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive">
            {t("choreEdit.confirmDelete")}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          {confirmingDelete ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={submitting}
                onClick={() => setConfirmingDelete(false)}
              >
                {t("scoreboard.cancel")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={submitting}
                onClick={handleDelete}
              >
                {t("choreEdit.confirmDeleteAction")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" disabled={submitting} onClick={onClose}>
                {t("scoreboard.cancel")}
              </Button>
              <Button size="sm" disabled={!fieldsValid || !isDirty || submitting} onClick={handleSave}>
                {t("scoreboard.save")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
