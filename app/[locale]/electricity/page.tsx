import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ElectricityCharts } from "@/components/electricity/electricity-charts";
import { SettingsPanel } from "@/components/settings-panel";
import { StatsCard } from "@/components/electricity/stats-card";
import { getElectricityDashboardData } from "@/lib/electricity-data";

type ElectricityPageProps = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ElectricityPage({ searchParams }: ElectricityPageProps) {
  const t = await getTranslations("electricity");
  const tCommon = await getTranslations("dashboard");
  const params = await searchParams;
  const requestedYear = Number(params.year);
  const data = await getElectricityDashboardData(
    Number.isFinite(requestedYear) ? requestedYear : undefined
  );
  const selectedYearIndex = data.availableYears.findIndex((year) => year === data.selectedYear);
  const previousYear = data.availableYears[selectedYearIndex - 1];
  const nextYear = data.availableYears[selectedYearIndex + 1];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="size-3.5" />
            {tCommon("title")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{t("headerTitle")}</span>
        </nav>
        <SettingsPanel />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("headerTitle")}</h1>
      </div>

      <section className="mb-8 flex items-center gap-3">
        {previousYear ? (
          <Link
            href={{ pathname: "/electricity", query: { year: String(previousYear) } }}
            className="rounded border px-2 py-1 text-sm hover:bg-muted"
            aria-label={t("yearSwitch.back")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("yearSwitch.back")}</span>
          </Link>
        ) : (
          <span
            className="rounded border px-2 py-1 text-sm text-muted-foreground opacity-50"
            aria-hidden="true"
          >
            <ChevronLeft className="size-4" />
          </span>
        )}
        <span className="min-w-16 text-center text-lg font-semibold">{data.selectedYear}</span>
        {nextYear ? (
          <Link
            href={{ pathname: "/electricity", query: { year: String(nextYear) } }}
            className="rounded border px-2 py-1 text-sm hover:bg-muted"
            aria-label={t("yearSwitch.forward")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("yearSwitch.forward")}</span>
          </Link>
        ) : (
          <span
            className="rounded border px-2 py-1 text-sm text-muted-foreground opacity-50"
            aria-hidden="true"
          >
            <ChevronRight className="size-4" />
          </span>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t("cards.totalCost")}
          value={`${data.summary.totalCostSek.toLocaleString()} SEK`}
        />
        <StatsCard
          title={t("cards.totalConsumption")}
          value={`${data.summary.totalSettledKwh.toLocaleString()} kWh`}
        />
        <StatsCard
          title={t("cards.averagePrice")}
          value={`${data.summary.averageCostSekPerMonth.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} SEK/mån`}
        />
      </section>

      {data.yearlySummary ? (
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title={t("yearlyCards.totalAnnualCost")}
              value={`${data.yearlySummary.totalAnnualCostSek.toLocaleString()} SEK`}
            />
            <StatsCard
              title={t("yearlyCards.annualElectricityFees")}
              value={`${data.yearlySummary.annualElectricitySupplierSek.toLocaleString()} SEK`}
            />
            <StatsCard
              title={t("yearlyCards.annualGridFees")}
              value={`${data.yearlySummary.annualGridFeesSek.toLocaleString()} SEK`}
            />
            <StatsCard
              title={t("yearlyCards.totalAnnualConsumption")}
              value={`${data.yearlySummary.totalAnnualSettledKwh.toLocaleString()} kWh`}
            />
            <StatsCard
              title={t("yearlyCards.averageTotalPrice")}
              value={`${data.yearlySummary.averageEnergyFeeInclVatOrePerKwh.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} öre/kWh`}
            />
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <ElectricityCharts
          data={data.monthly}
          card1Title={t("charts.card1Title")}
          card2Title={t("charts.card2Title")}
          card3Title={t("charts.card3Title")}
          card4Title={t("charts.card4Title")}
          totalLabel={t("charts.totalLabel")}
          averageLabel={t("charts.averageLabel")}
          aggregatedLabel={t("charts.aggregatedLabel")}
          commentsLabel={t("charts.commentsLabel")}
          legendSupplier={t("charts.legendSupplier")}
          legendGridFees={t("charts.legendGridFees")}
          legendSupplierShort={t("charts.legendSupplierShort")}
          legendGridFeesShort={t("charts.legendGridFeesShort")}
          legendEnergyFee={t("charts.legendEnergyFee")}
          legendEnergyTax={t("charts.legendEnergyTax")}
          legendTransfer={t("charts.legendTransfer")}
          legendEnergyFeeShort={t("charts.legendEnergyFeeShort")}
          legendEnergyTaxShort={t("charts.legendEnergyTaxShort")}
          legendTransferShort={t("charts.legendTransferShort")}
          legendTotalCost={t("charts.legendTotalCost")}
          legendSettledKwh={t("charts.legendSettledKwh")}
        />
      </section>
    </main>
  );
}
