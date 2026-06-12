"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Chore, ChoreCard } from "./chore-card";
import { PinPad } from "./pin-pad";
import { InspectCelebration } from "./inspect-celebration";
import { ChoreEditDialog } from "./chore-edit-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Loader2, Pencil, Plus } from "lucide-react";

import users from "../../data/chores-users.json";
const FAMILY_MEMBERS = users;

// How often each device re-pulls chore state to pick up other devices' changes.
const POLL_INTERVAL_MS = 4000;

// Card display order: finished (awaiting inspection) → started → ready → inspected
const STATUS_ORDER: Record<Chore["status"], number> = {
  finished: 0,
  started: 1,
  ready: 2,
  inspected: 3,
};

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
  const [pendingEditUserId, setPendingEditUserId] = useState<string | null>(null);
  const [editingPointsUserId, setEditingPointsUserId] = useState<string | null>(null);
  const [setToInput, setSetToInput] = useState<string>("");
  const [pendingEditChoreId, setPendingEditChoreId] = useState<string | null>(null);
  const [pendingAddChore, setPendingAddChore] = useState<boolean>(false);
  const [chorePadDialog, setChorePadDialog] = useState<
    | { mode: "add" }
    | { mode: "edit"; choreId: string }
    | null
  >(null);

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

  // Poll for changes made on other devices. A tick is skipped while the user is
  // mid-interaction so a refetch never clobbers an open edit panel / overlay.
  const busy =
    chorePadDialog !== null ||
    editingPointsUserId !== null ||
    pendingEditChoreId !== null ||
    pendingEditUserId !== null ||
    pendingAddChore ||
    inspectingChoreId !== null ||
    celebration !== null;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    const maybeFetch = () => {
      if (document.hidden || busyRef.current) return;
      fetchDataRef.current();
    };
    const id = setInterval(maybeFetch, POLL_INTERVAL_MS);
    // Refresh immediately when returning to a backgrounded tab/device.
    const onVisibility = () => {
      if (!document.hidden) maybeFetch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
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

  const handleAdjust = async (
    userId: string,
    payload: { delta?: number; setTo?: number }
  ) => {
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust", userId, ...payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setChores(data.chores || []);
        setPoints(data.points || {});
        if (data.counts) setCounts(data.counts);
        if (data.lastDoneBy) setLastDoneBy(data.lastDoneBy);
        return true;
      }
      alert(data.error || "Adjustment failed");
      return false;
    } catch (err) {
      console.error("Error adjusting points:", err);
      return false;
    }
  };

  const handleInspectRequest = (choreId: string) => {
    setInspectingChoreId(choreId);
  };

  const handlePinSuccess = async () => {
    if (inspectingChoreId) {
      await handleInspectSuccess();
      return;
    }
    if (pendingEditUserId) {
      setEditingPointsUserId(pendingEditUserId);
      setSetToInput(String(points[pendingEditUserId] ?? 0));
      setPendingEditUserId(null);
      return;
    }
    if (pendingEditChoreId) {
      setChorePadDialog({ mode: "edit", choreId: pendingEditChoreId });
      setPendingEditChoreId(null);
      return;
    }
    if (pendingAddChore) {
      setChorePadDialog({ mode: "add" });
      setPendingAddChore(false);
    }
  };

  const closePinPad = () => {
    setInspectingChoreId(null);
    setPendingEditUserId(null);
    setPendingEditChoreId(null);
    setPendingAddChore(false);
  };

  const postChoreAction = async (body: Record<string, unknown>, errorLabel: string) => {
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setChores(data.chores || []);
        setPoints(data.points || {});
        if (data.counts) setCounts(data.counts);
        if (data.lastDoneBy) setLastDoneBy(data.lastDoneBy);
        return true;
      }
      alert(data.error || errorLabel);
      return false;
    } catch (err) {
      console.error(errorLabel, err);
      return false;
    }
  };

  const handleAddChore = (payload: { title: string; icon: string; points: number }) =>
    postChoreAction({ action: "add-chore", ...payload }, "Add chore failed");

  const handleUpdateChore = (
    choreId: string,
    payload: { title: string; icon: string; points: number }
  ) => postChoreAction({ action: "update-chore", choreId, ...payload }, "Update chore failed");

  const handleDeleteChore = (choreId: string) =>
    postChoreAction({ action: "delete-chore", choreId }, "Delete chore failed");

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

  const sortedChores = [...chores].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

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
      onClick={() => {
        setExpandedUserId(isExpanded ? null : memberId);
        setEditingPointsUserId(null);
      }}
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
              const isEditing = editingPointsUserId === expandedUserId;
              const expandedUserPoints = points[expandedUserId] || 0;
              const setToNumber = Number(setToInput);
              const setToValid = setToInput.trim() !== "" && Number.isInteger(setToNumber);
              return (
                <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      {expandedMember.name} — {t("scoreboard.historyTitle")}
                    </div>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setPendingEditUserId(expandedUserId)}
                        className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                      >
                        <Pencil className="size-3" />
                        {t("scoreboard.editPoints")}
                      </button>
                    ) : null}
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
                            {chore.title ?? (chore.titleKey ? t(`tasks.${chore.titleKey}`) : chore.id)}
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {count} {t("scoreboard.timesSuffix")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isEditing ? (
                    <div className="mt-4 space-y-3 rounded-lg border bg-background p-3">
                      <div className="text-xs text-muted-foreground">
                        {t("scoreboard.currentTotal")}:{" "}
                        <span className="font-bold tabular-nums text-foreground">
                          {expandedUserPoints}p
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">
                          {t("scoreboard.setTo")}
                        </label>
                        <input
                          type="number"
                          step="1"
                          inputMode="numeric"
                          value={setToInput}
                          onChange={(e) => setSetToInput(e.target.value)}
                          className="w-24 rounded border bg-background px-2 py-1 text-sm tabular-nums"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[-5, -1, 1, 5].map((step) => (
                          <Button
                            key={step}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const current = Number(setToInput);
                              const base = Number.isFinite(current) ? current : expandedUserPoints;
                              setSetToInput(String(base + step));
                            }}
                          >
                            {step > 0 ? `+${step}` : `${step}`}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          disabled={!setToValid || setToNumber === expandedUserPoints}
                          onClick={async () => {
                            if (!setToValid) return;
                            const ok = await handleAdjust(expandedUserId, { setTo: setToNumber });
                            if (ok) setEditingPointsUserId(null);
                          }}
                        >
                          {t("scoreboard.save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPointsUserId(null)}
                        >
                          {t("scoreboard.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })() : null}
          </CardContent>
        </Card>
      </section>

      {/* Task List Grid */}
      <section>
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPendingAddChore(true)}
          >
            <Plus className="size-4 mr-1" />
            {t("choreEdit.addChore")}
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onAction={handleAction}
              onRequestInspect={handleInspectRequest}
              lastDoneByUserId={lastDoneBy[chore.id]?.userId ?? null}
              onRequestEdit={() => setPendingEditChoreId(chore.id)}
            />
          ))}
        </div>
      </section>

      {/* Parent PIN Overlay */}
      <PinPad
        isOpen={
          inspectingChoreId !== null ||
          pendingEditUserId !== null ||
          pendingEditChoreId !== null ||
          pendingAddChore
        }
        onClose={closePinPad}
        onSuccess={handlePinSuccess}
        title={t("pinPad.title")}
        cancelLabel={t("pinPad.cancel")}
        errorLabel={t("pinPad.error")}
      />

      {(() => {
        if (!chorePadDialog) {
          return (
            <ChoreEditDialog
              open={false}
              mode="add"
              onSave={async () => false}
              onClose={() => {}}
            />
          );
        }
        if (chorePadDialog.mode === "add") {
          return (
            <ChoreEditDialog
              open={true}
              mode="add"
              onSave={(payload) => handleAddChore(payload)}
              onClose={() => setChorePadDialog(null)}
            />
          );
        }
        const target = chores.find((c) => c.id === chorePadDialog.choreId);
        if (!target) {
          // Chore disappeared (e.g. another device deleted it). Close gracefully.
          setChorePadDialog(null);
          return null;
        }
        const titleText =
          target.title ?? (target.titleKey ? t(`tasks.${target.titleKey}`) : target.id);
        return (
          <ChoreEditDialog
            open={true}
            mode="edit"
            initial={{
              id: target.id,
              title: titleText,
              icon: target.icon,
              points: target.points,
            }}
            onSave={(payload) => handleUpdateChore(target.id, payload)}
            onDelete={() => handleDeleteChore(target.id)}
            onClose={() => setChorePadDialog(null)}
          />
        );
      })()}

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
