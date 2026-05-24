"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Chore, ChoreCard } from "./chore-card";
import { PinPad } from "./pin-pad";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Star, Loader2 } from "lucide-react";

import users from "../../data/chores-users.json";
const FAMILY_MEMBERS = users;

export function ChoresBoard() {
  const t = useTranslations("chores");
  const [chores, setChores] = useState<Chore[]>([]);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [inspectingChoreId, setInspectingChoreId] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch("/api/chores");
      const data = await res.json();
      setChores(data.chores || []);
      setPoints(data.points || {});
    } catch (err) {
      console.error("Error fetching chores data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (choreId: string, action: string, assignee?: string) => {
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, choreId, assignee }),
      });
      const data = await res.json();
      if (res.ok) {
        setChores(data.chores || []);
        setPoints(data.points || {});
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(`Error sending action ${action}:`, err);
    }
  };

  const handleInspectRequest = (choreId: string) => {
    setInspectingChoreId(choreId);
  };

  const handleInspectSuccess = async () => {
    if (inspectingChoreId) {
      await handleAction(inspectingChoreId, "inspect");
      setInspectingChoreId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Scoreboard / Leaderboard */}
      <section>
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              {t("scoreboard.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 max-w-2xl">
{FAMILY_MEMBERS.map((member) => {
  const memberPoints = points[member.id] || 0;
  return (
    <div
      key={member.name}
      className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card shadow-xs transition-all duration-200 hover:shadow-sm"
    >
      <span className="text-4xl filter drop-shadow-sm select-none mb-1">
        {(member as any).emoji}
      </span>
      <span className="text-sm font-bold truncate max-w-full">
        {member.name}
      </span>
      <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Star className="size-3 fill-amber-500 text-amber-500" />
        {memberPoints}p
      </span>
    </div>
  );
})}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Task List Grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-muted-foreground">
            {t("tasks.heading")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onAction={handleAction}
              onRequestInspect={handleInspectRequest}
            />
          ))}
        </div>
      </section>

      {/* Parent PIN Overlay */}
      <PinPad
        isOpen={inspectingChoreId !== null}
        onClose={() => setInspectingChoreId(null)}
        onSuccess={handleInspectSuccess}
        title={t("pinPad.title")}
        cancelLabel={t("pinPad.cancel")}
        errorLabel={t("pinPad.error")}
      />
    </div>
  );
}
