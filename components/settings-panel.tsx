"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Moon, Settings, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname, useRouter } from "@/i18n/navigation";

type Locale = "sv" | "en";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "home-stats-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function SettingsPanel() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
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

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
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
        <Card className="absolute right-0 top-10 z-20 w-[min(18rem,calc(100vw-1.5rem))] max-h-[calc(100vh-5rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">{t("settingsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Languages className="size-4" />
                {t("languageLabel")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={locale === "sv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchLocale("sv")}
                >
                  {t("localeSv")}
                </Button>
                <Button
                  type="button"
                  variant={locale === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchLocale("en")}
                >
                  {t("localeEn")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
