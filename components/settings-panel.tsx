"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Settings, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "home-stats-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function SettingsPanel() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeMode | null;

    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function setAndPersistTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={t("settingsButtonLabel")}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings className="size-4" />
      </Button>

      {open ? (
        <Card className="absolute right-0 top-10 z-20 w-64">
          <CardHeader>
            <CardTitle className="text-base">{t("settingsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm font-medium">{t("themeLabel")}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setAndPersistTheme("light")}
              >
                <Sun className="size-4" />
                {t("themeLight")}
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setAndPersistTheme("dark")}
              >
                <Moon className="size-4" />
                {t("themeDark")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
