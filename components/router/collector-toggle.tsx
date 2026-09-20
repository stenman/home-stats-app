"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CollectorToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations("router.collector");
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setBusy(true);
    try {
      const res = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error("request failed");
      setEnabled(next);
      router.refresh();
    } catch {
      // Leave the toggle in its previous state; nothing was persisted.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={busy}
      aria-pressed={enabled}
      title={t("hint")}
    >
      <span
        className={`size-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
        aria-hidden="true"
      />
      <Power className="size-4" aria-hidden="true" />
      {enabled ? t("on") : t("off")}
    </Button>
  );
}
