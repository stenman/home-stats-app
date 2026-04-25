"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const isEnglish = locale === "en";

  function toggleLocale() {
    router.replace(pathname, { locale: isEnglish ? "sv" : "en" });
  }

  return (
    <Button
      type="button"
      aria-label={t("languageSwitchLabel")}
      onClick={toggleLocale}
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2"
    >
      <Languages className="size-4" />
      <span className="text-xs font-medium">{isEnglish ? t("localeEn") : t("localeSv")}</span>
    </Button>
  );
}
