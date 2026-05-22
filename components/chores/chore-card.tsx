"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Zap, Check, RotateCcw, AlertCircle, Play, ShieldCheck } from "lucide-react";

export type ChoreStatus = "ready" | "started" | "finished" | "inspected";

export type Chore = {
  id: string;
  icon: string;
  titleKey: string;
  points: number;
  status: ChoreStatus;
  assignee: string | null;
};

type ChoreCardProps = {
  chore: Chore;
  onAction: (choreId: string, action: string, assignee?: string) => void;
  onRequestInspect: (choreId: string) => void;
};

const FAMILY_MEMBERS = [
  { name: "Roger", emoji: "👨" },
  { name: "Jenny", emoji: "👩" },
  { name: "Leia", emoji: "👧" },
  { name: "Vidar", emoji: "👦" },
  { name: "Tyra", emoji: "👶" },
];

export function ChoreCard({ chore, onAction, onRequestInspect }: ChoreCardProps) {
  const t = useTranslations("chores");
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // Status configuration
  const statusConfig = {
    ready: {
      bg: "bg-red-50/90 dark:bg-red-950/10",
      border: "border-red-200 dark:border-red-900/40",
      accent: "text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/30",
      indicator: t("status.ready"),
    },
    started: {
      bg: "bg-amber-50/90 dark:bg-amber-950/10",
      border: "border-amber-200 dark:border-amber-900/40",
      accent: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30",
      indicator: t("status.started"),
    },
    finished: {
      bg: "bg-emerald-50/90 dark:bg-emerald-950/10",
      border: "border-emerald-200 dark:border-emerald-900/40",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/30",
      indicator: t("status.finished"),
    },
    inspected: {
      bg: "bg-slate-100/80 dark:bg-slate-900/50",
      border: "border-slate-300/80 dark:border-slate-800/80",
      accent: "text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800/80",
      indicator: t("status.inspected"),
    },
  };

  const config = statusConfig[chore.status];

  const handleStart = () => {
    if (selectedAssignee) {
      onAction(chore.id, "start", selectedAssignee);
      setSelectedAssignee(null);
    }
  };

  const currentAssigneeEmoji = FAMILY_MEMBERS.find((m) => m.name === chore.assignee)?.emoji || "👤";

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-300 min-h-[300px] ${config.bg} ${config.border} hover:shadow-md`}
    >
      <div>
        {/* Top Header: Chore Icon, Points, and Status Indicator */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl filter drop-shadow-sm select-none">{chore.icon}</span>
            <div>
              <h3 className="font-bold text-lg tracking-tight leading-snug">
                {t(`tasks.${chore.titleKey}`)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.accent}`}>
                  <Zap className="size-3" />
                  {chore.points}p
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {config.indicator}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Content: Assignee Avatar Selection or Assignee Display */}
        <div className="my-6">
          {chore.status === "ready" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                {t("labels.selectAssignee")}
              </label>
              <div className="flex flex-wrap gap-2">
                {FAMILY_MEMBERS.map((member) => {
                  const isSelected = selectedAssignee === member.name;
                  return (
                    <button
                      key={member.name}
                      type="button"
                      onClick={() => setSelectedAssignee(isSelected ? null : member.name)}
                      className={`flex flex-col items-center justify-center gap-1 size-16 rounded-xl border transition-all duration-200 active:scale-95 touch-manipulation shadow-sm ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground scale-105 font-bold shadow-md"
                          : "bg-background border-border hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-2xl select-none">{member.emoji}</span>
                      <span className="text-[10px] truncate max-w-full px-1">{member.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-background/50 p-3 shadow-xs">
              <span className="text-3xl filter drop-shadow-xs select-none">{currentAssigneeEmoji}</span>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("labels.assignedTo")}
                </div>
                <div className="font-bold text-sm text-foreground">{chore.assignee}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Dynamic Action Buttons */}
      <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-end gap-2">
        {chore.status === "ready" && (
          <Button
            size="lg"
            className="w-full font-bold h-12 shadow-sm rounded-xl"
            disabled={!selectedAssignee}
            onClick={handleStart}
          >
            <Play className="size-4 mr-1.5" />
            {t("buttons.start")}
          </Button>
        )}

        {chore.status === "started" && (
          <>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-semibold h-12 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive active:bg-destructive/10"
              onClick={() => onAction(chore.id, "cancel")}
            >
              <AlertCircle className="size-4 mr-1.5" />
              {t("buttons.cancel")}
            </Button>
            <Button
              size="lg"
              className="flex-1 font-bold h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              onClick={() => onAction(chore.id, "finish")}
            >
              <Check className="size-4 mr-1.5" />
              {t("buttons.finish")}
            </Button>
          </>
        )}

        {chore.status === "finished" && (
          <Button
            size="lg"
            className="w-full font-bold h-12 rounded-xl bg-primary text-primary-foreground shadow-sm"
            onClick={() => onRequestInspect(chore.id)}
          >
            <ShieldCheck className="size-4 mr-1.5" />
            {t("buttons.inspect")}
          </Button>
        )}

        {chore.status === "inspected" && (
          <Button
            variant="outline"
            size="lg"
            className="w-full font-bold h-12 rounded-xl border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => onAction(chore.id, "reset")}
          >
            <RotateCcw className="size-4 mr-1.5" />
            {t("buttons.reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
