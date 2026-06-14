"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImportResult = {
  imported: number;
  years: number[];
  warnings: string[];
};

type Props = {
  onClose: () => void;
  onImported: () => void;
};

// Mounted only while open (see ImportButton), so state resets naturally on each open.
export function ImportDialog({ onClose, onImported }: Props) {
  const t = useTranslations("electricity.import");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const response = await fetch("/api/electricity", {
        method: "POST",
        headers: { "Content-Type": "text/tab-separated-values" },
        body: text,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? t("error"));
        return;
      }
      setResult(data as ImportResult);
      onImported();
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t("title")}</h2>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!submitting) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <Upload className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("dropHint")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("chooseFile")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tsv,.txt,text/tab-separated-values,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {submitting ? (
          <p className="text-sm text-muted-foreground">{t("importing")}</p>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-1 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              {t("success", { count: result.imported })}
            </p>
            {result.years.length ? (
              <p className="text-muted-foreground">
                {t("yearsRange", {
                  from: result.years[0],
                  to: result.years[result.years.length - 1],
                })}
              </p>
            ) : null}
            {result.warnings.length ? (
              <p className="text-amber-600 dark:text-amber-400">
                {t("warningsCount", { count: result.warnings.length })}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" disabled={submitting} onClick={onClose}>
            {result ? t("close") : t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
