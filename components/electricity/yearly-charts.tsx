"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { YearlyElectricityPoint } from "@/lib/electricity-data";
import { useTranslations } from "next-intl";

type Format = "sek" | "kwh" | "ore" | "sekPerMonth";

type ChartConfig = {
  key: keyof YearlyElectricityPoint;
  titleKey: string;
  format: Format;
  color: string;
};

const CHARTS: ChartConfig[] = [
  { key: "totalAnnualCostSek", titleKey: "annualTotalCost", format: "sek", color: "#2563eb" },
  { key: "totalAnnualSettledKwh", titleKey: "annualConsumption", format: "kwh", color: "#059669" },
  { key: "annualElectricitySupplierSek", titleKey: "annualEnergyCost", format: "sek", color: "#7c3aed" },
  { key: "annualGridFeesSek", titleKey: "annualGridCost", format: "sek", color: "#14b8a6" },
  { key: "avgEnergyFeeOrePerKwh", titleKey: "avgEnergyOrePerKwh", format: "ore", color: "#f59e0b" },
  { key: "avgTotalPriceOrePerKwh", titleKey: "avgTotalOrePerKwh", format: "ore", color: "#ef4444" },
  { key: "avgElectricitySupplierSek", titleKey: "avgEnergyPerMonth", format: "sekPerMonth", color: "#6366f1" },
  { key: "avgGridFeesSek", titleKey: "avgGridPerMonth", format: "sekPerMonth", color: "#0ea5e9" },
  { key: "avgTotalCostSek", titleKey: "avgTotalPerMonth", format: "sekPerMonth", color: "#db2777" },
];

function formatNumber(value: number, format: Format): string {
  const digits = format === "ore" ? 1 : 0;
  return value.toLocaleString("sv-SE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

type Props = {
  data: YearlyElectricityPoint[];
};

export function YearlyCharts({ data }: Props) {
  const t = useTranslations("electricity.yearly");

  const partialYears = data.filter((d) => d.monthsCount < 12);
  const partialYearSet = new Set(partialYears.map((d) => d.year));
  const formatYearTick = (year: number) => (partialYearSet.has(year) ? `${year}*` : `${year}`);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {CHARTS.map((chart) => (
          <Card key={chart.key}>
            <CardHeader>
              <CardTitle>{t(`charts.${chart.titleKey}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 100, height: 100 }}
                >
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tickFormatter={(value) => formatYearTick(Number(value))} />
                    <YAxis />
                    <Tooltip
                      cursor={{ fillOpacity: 0.1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const value = Number(payload[0].value ?? 0);
                        return (
                          <div className="rounded-md border bg-background px-2.5 py-1.5 text-sm shadow-md">
                            {label}: {formatNumber(value, chart.format)}
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey={chart.key}
                      name={t(`charts.${chart.titleKey}`)}
                      fill={chart.color}
                      fillOpacity={0.85}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {partialYears.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {partialYears
            .map((d) => t("partialNote", { year: d.year, months: d.monthsCount }))
            .join("  ·  ")}
        </p>
      ) : null}
    </div>
  );
}
