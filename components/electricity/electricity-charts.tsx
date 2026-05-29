"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonthlyElectricityPoint } from "@/lib/electricity-data";

type ElectricityChartsProps = {
  data: MonthlyElectricityPoint[];
  card1Title: string;
  card2Title: string;
  card3Title: string;
  card4Title: string;
  totalLabel: string;
  averageLabel: string;
  aggregatedLabel: string;
  commentsLabel: string;
  legendSupplier: string;
  legendGridFees: string;
  legendSupplierShort: string;
  legendGridFeesShort: string;
  legendEnergyFee: string;
  legendEnergyTax: string;
  legendTransfer: string;
  legendEnergyFeeShort: string;
  legendEnergyTaxShort: string;
  legendTransferShort: string;
  legendTotalCost: string;
  legendSettledKwh: string;
};

export function ElectricityCharts({
  data,
  card1Title,
  card2Title,
  card3Title,
  card4Title,
  totalLabel,
  averageLabel,
  aggregatedLabel,
  commentsLabel,
  legendSupplier,
  legendGridFees,
  legendSupplierShort,
  legendGridFeesShort,
  legendEnergyFee,
  legendEnergyTax,
  legendTransfer,
  legendEnergyFeeShort,
  legendEnergyTaxShort,
  legendTransferShort,
  legendTotalCost,
  legendSettledKwh,
}: ElectricityChartsProps) {
  const chartData = data.map((item) => ({
    ...item,
    card1A: item.electricitySupplierSek,
    card1B: item.gridFeesSek,
    card1Aggregated: item.electricitySupplierSek + item.gridFeesSek,
    card2A: item.energyFeeInclVatOrePerKwh,
    card2B: item.energyTaxInclVatOrePerKwh,
    card2C: item.transferInclVatOrePerKwh,
    card2Aggregated:
      item.energyFeeInclVatOrePerKwh +
      item.energyTaxInclVatOrePerKwh +
      item.transferInclVatOrePerKwh,
    card3: item.totalCostSek,
    card4: item.settledKwh,
  }));

  const metricSummary = (keys: string[]) => {
    const totals = keys.map((key) =>
      chartData.reduce((sum, row) => sum + Number(row[key as keyof typeof row]), 0)
    );
    const grandTotal = totals.reduce((sum, value) => sum + value, 0);
    const averages = totals.map((value) => value / chartData.length);
    const aggregatedAverage = grandTotal / chartData.length;
    return { totals, grandTotal, averages, aggregatedAverage };
  };

  const card1Stats = metricSummary(["card1A", "card1B"]);
  const card2Stats = metricSummary(["card2A", "card2B", "card2C"]);
  const card3Stats = metricSummary(["card3"]);
  const card4Stats = metricSummary(["card4"]);
  const formatValue = (value: number) =>
    value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });

  const tooltipFormatter = (value: unknown, name: unknown) => [
    formatValue(Number(value ?? 0)),
    String(name ?? ""),
  ] as [string, string];

  const labelWithComment = (
    label: string,
    payload?: ReadonlyArray<{ payload?: MonthlyElectricityPoint }>
  ) => {
    const point = payload?.[0]?.payload;
    return point?.comment ? `${label} - ${commentsLabel}: ${point.comment}` : label;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{card1Title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label, payload) => labelWithComment(label, payload)}
                />
                <Legend />
                <Area
                  dataKey="card1A"
                  name={legendSupplier}
                  stackId="card1"
                  type="monotone"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.15}
                />
                <Area
                  dataKey="card1B"
                  name={legendGridFees}
                  stackId="card1"
                  type="monotone"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.15}
                />
                <Area
                  dataKey="card1Aggregated"
                  name={aggregatedLabel}
                  type="monotone"
                  stroke="#111827"
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 text-sm">
            <p>
              {totalLabel}: {legendSupplierShort} {formatValue(card1Stats.totals[0])}, {legendGridFeesShort}{" "}
              {formatValue(card1Stats.totals[1])}, {aggregatedLabel}{" "}
              {formatValue(card1Stats.grandTotal)}
            </p>
            <p className="text-muted-foreground">
              {averageLabel}: {legendSupplierShort} {formatValue(card1Stats.averages[0])}, {legendGridFeesShort}{" "}
              {formatValue(card1Stats.averages[1])}, {aggregatedLabel}{" "}
              {formatValue(card1Stats.aggregatedAverage)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{card2Title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label, payload) => labelWithComment(label, payload)}
                />
                <Legend />
                <Area
                  dataKey="card2A"
                  name={legendEnergyFee}
                  stackId="card2"
                  type="monotone"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.15}
                />
                <Area
                  dataKey="card2B"
                  name={legendEnergyTax}
                  stackId="card2"
                  type="monotone"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                />
                <Area
                  dataKey="card2C"
                  name={legendTransfer}
                  stackId="card2"
                  type="monotone"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.15}
                />
                <Area
                  dataKey="card2Aggregated"
                  name={aggregatedLabel}
                  type="monotone"
                  stroke="#111827"
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 text-sm">
            <p>
              {totalLabel}: {legendEnergyFeeShort} {formatValue(card2Stats.totals[0])}, {legendEnergyTaxShort}{" "}
              {formatValue(card2Stats.totals[1])}, {legendTransferShort} {formatValue(card2Stats.totals[2])},{" "}
              {aggregatedLabel} {formatValue(card2Stats.grandTotal)}
            </p>
            <p className="text-muted-foreground">
              {averageLabel}: {legendEnergyFeeShort} {formatValue(card2Stats.averages[0])}, {legendEnergyTaxShort}{" "}
              {formatValue(card2Stats.averages[1])}, {legendTransferShort}{" "}
              {formatValue(card2Stats.averages[2])}, {aggregatedLabel}{" "}
              {formatValue(card2Stats.aggregatedAverage)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{card3Title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label, payload) => labelWithComment(label, payload)}
                />
                <Legend />
                <Area
                  dataKey="card3"
                  name={legendTotalCost}
                  type="monotone"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 text-sm">
            <p>
              {totalLabel}: {formatValue(card3Stats.grandTotal)}
            </p>
            <p className="text-muted-foreground">
              {averageLabel}: {formatValue(card3Stats.aggregatedAverage)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{card4Title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={(label, payload) => labelWithComment(label, payload)}
                />
                <Legend />
                <Area
                  dataKey="card4"
                  name={legendSettledKwh}
                  type="monotone"
                  stroke="#059669"
                  fill="#34d399"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-1 text-sm">
            <p>
              {totalLabel}: {formatValue(card4Stats.grandTotal)}
            </p>
            <p className="text-muted-foreground">
              {averageLabel}: {formatValue(card4Stats.aggregatedAverage)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
