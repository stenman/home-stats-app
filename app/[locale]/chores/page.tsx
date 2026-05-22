import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Home } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SettingsPanel } from "@/components/settings-panel";
import { ChoresBoard } from "@/components/chores/chores-board";

export default async function ChoresPage() {
  const t = await getTranslations("chores");
  const tDashboard = await getTranslations("dashboard");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home className="size-3.5" />
          {tDashboard("title")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t("title")}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <SettingsPanel />
        </div>
      </div>

      <ChoresBoard />
    </main>
  );
}
