import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SettingsPanel } from "@/components/settings-panel";
import { YearlyCharts } from "@/components/electricity/yearly-charts";
import { getElectricityYearlyData } from "@/lib/electricity-data";

export default async function ElectricityYearlyPage() {
  const t = await getTranslations("electricity");
  const tCommon = await getTranslations("dashboard");
  const data = await getElectricityYearlyData();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="size-3.5" />
            {tCommon("title")}
          </Link>
          <span>/</span>
          <Link href="/electricity" className="transition-colors hover:text-foreground">
            {t("headerTitle")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{t("yearly.headerTitle")}</span>
        </nav>
        <SettingsPanel />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("yearly.headerTitle")}</h1>
      </div>

      {data.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">{t("yearly.emptyState")}</p>
          <Link href="/electricity" className="rounded border px-3 py-1.5 text-sm hover:bg-muted">
            {t("headerTitle")}
          </Link>
        </section>
      ) : (
        <YearlyCharts data={data} />
      )}
    </main>
  );
}
