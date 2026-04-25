"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonthlyElectricityPoint } from "@/lib/electricity-data";

type ElectricityChartsProps = {
  data: MonthlyElectricityPoint[];
  monthlyCostsTitle: string;
  monthlyCostsDescription: string;
  monthlyConsumptionTitle: string;
  monthlyConsumptionDescription: string;
};

export function ElectricityCharts({
  data,
  monthlyCostsTitle,
  monthlyCostsDescription,
  monthlyConsumptionTitle,
  monthlyConsumptionDescription,
}: ElectricityChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{monthlyCostsTitle}</CardTitle>
          <CardDescription>{monthlyCostsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="costSek" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{monthlyConsumptionTitle}</CardTitle>
          <CardDescription>{monthlyConsumptionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                dataKey="consumptionKwh"
                type="monotone"
                stroke="#059669"
                fill="#34d399"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
