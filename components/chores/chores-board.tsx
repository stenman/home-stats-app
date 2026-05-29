"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Chore, ChoreCard } from "./chore-card";
import { PinPad } from "./pin-pad";
import { InspectCelebration } from "./inspect-celebration";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Star, Loader2 } from "lucide-react";

import users from "../../data/chores-users.json";
const FAMILY_MEMBERS = users;

type CountsByUser = Record<string, Record<string, number>>;
type LastDoneByMap = Record<string, { userId: string; at: string }>;
type Celebration = {
  userName: string;
  avatarSrc: string | null;
  emoji: string;
  points: number;
};

export function ChoresBoard() {
  const t = useTranslations("chores");
  const [chores, setChores] = useState<Chore[]>([]);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [counts, setCounts] = useState<CountsByUser>({});
  const [lastDoneBy, setLastDoneBy] = useState<LastDoneByMap>({});
  const [loading, setLoading] = useState(true);
  const [inspectingChoreId, setInspectingChoreId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch("/api/chores");
      const data = await res.json();
      setChores(data.chores || []);
      setPoints(data.points || {});
      setCounts(data.counts || {});
      setLastDoneBy(data.lastDoneBy || {});
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
        if (data.counts) setCounts(data.counts);
        if (data.lastDoneBy) setLastDoneBy(data.lastDoneBy);
        return true;
      }
      alert(data.error || "Action failed");
      return false;
    } catch (err) {
      console.error(`Error sending action ${action}:`, err);
      return false;
    }
  };

  const handleInspectRequest = (choreId: string) => {
    setInspectingChoreId(choreId);
  };

  const handleInspectSuccess = async () => {
    if (!inspectingChoreId) return;
    const chore = chores.find((c) => c.id === inspectingChoreId);
    const assignee = chore?.assignee
      ? FAMILY_MEMBERS.find((m) => String(m.id) === chore.assignee)
      : null;
    const succeeded = await handleAction(inspectingChoreId, "inspect");
    setInspectingChoreId(null);
    if (succeeded && chore && assignee) {
      setCelebration({
        userName: assignee.name,
        avatarSrc: assignee.name ? `/avatars/${assignee.name.toLowerCase()}.png` : null,
        emoji: (assignee as any).emoji ?? "🎉",
        points: chore.points,
      });
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
  const memberId = String(member.id);
  const memberPoints = points[memberId] || 0;
  const avatarPath = `/avatars/${member.name?.toLowerCase()}.png`;
  const hasAvatar = member.name;
  const isExpanded = expandedUserId === memberId;
  return (
    <button
      type="button"
      key={member.name}
      aria-expanded={isExpanded}
      onClick={() => setExpandedUserId(isExpanded ? null : memberId)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-card shadow-xs transition-all duration-200 hover:shadow-sm text-left touch-manipulation ${isExpanded ? "ring-2 ring-primary" : ""}`}
    >
      {hasAvatar ? (
        <img src={avatarPath} alt={member.name} className="w-12 h-12 rounded-full object-cover mb-1" />
      ) : (
        <span className="text-4xl filter drop-shadow-sm select-none mb-1">
          {(member as any).emoji}
        </span>
      )}
      <span className="text-sm font-bold truncate max-w-full">
        {member.name}
      </span>
      <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Star className="size-3 fill-amber-500 text-amber-500" />
        {memberPoints}p
      </span>
    </button>
  );
})}
            </div>
            {expandedUserId !== null ? (() => {
              const expandedMember = FAMILY_MEMBERS.find((m) => String(m.id) === expandedUserId);
              if (!expandedMember) return null;
              const userCounts = counts[expandedUserId] || {};
              const rows = chores
                .map((chore) => ({ chore, count: userCounts[chore.id] || 0 }))
                .filter((row) => row.count > 0)
                .sort((a, b) => b.count - a.count);
              return (
                <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-semibold">
                    {expandedMember.name} — {t("scoreboard.historyTitle")}
                  </div>
                  {rows.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {t("scoreboard.historyEmpty")}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {rows.map(({ chore, count }) => (
                        <li
                          key={chore.id}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <span className="text-xl select-none">{chore.icon}</span>
                            {t(`tasks.${chore.titleKey}`)}
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {count} {t("scoreboard.timesSuffix")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })() : null}
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
              lastDoneByUserId={lastDoneBy[chore.id]?.userId ?? null}
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

      <InspectCelebration
        open={celebration !== null}
        userName={celebration?.userName ?? ""}
        avatarSrc={celebration?.avatarSrc ?? null}
        emoji={celebration?.emoji ?? "🎉"}
        points={celebration?.points ?? 0}
        onClose={() => setCelebration(null)}
      />
    </div>
  );
}
