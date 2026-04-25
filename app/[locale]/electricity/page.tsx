import { getTranslations } from "next-intl/server";
import { ElectricityCharts } from "@/components/electricity/electricity-charts";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SettingsPanel } from "@/components/settings-panel";
import { StatsCard } from "@/components/electricity/stats-card";
import { getElectricityDashboardData } from "@/lib/electricity-data";

export default async function ElectricityPage() {
  const t = await getTranslations("electricity");
  const data = await getElectricityDashboardData();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t("headerTitle")}</h1>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <SettingsPanel />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t("cards.totalCost")}
          value={`${data.summary.totalCostSek.toLocaleString()} SEK`}
          trendPercent={data.summary.costTrendPercent}
        />
        <StatsCard
          title={t("cards.totalConsumption")}
          value={`${data.summary.totalConsumptionKwh.toLocaleString()} kWh`}
          trendPercent={data.summary.consumptionTrendPercent}
        />
        <StatsCard
          title={t("cards.averagePrice")}
          value={`${data.summary.averagePriceSekPerKwh.toFixed(2)} SEK/kWh`}
          trendPercent={data.summary.averagePriceTrendPercent}
        />
      </section>

      <section className="mt-8">
        <ElectricityCharts
          data={data.monthly}
          monthlyCostsTitle={t("charts.monthlyCostsTitle")}
          monthlyCostsDescription={t("charts.monthlyCostsDescription")}
          monthlyConsumptionTitle={t("charts.monthlyConsumptionTitle")}
          monthlyConsumptionDescription={t("charts.monthlyConsumptionDescription")}
        />
      </section>
    </main>
  );
}
