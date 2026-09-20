"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DailyThroughputPoint,
  ResourcePoint,
  ThroughputPoint,
  TopClientPoint,
} from "@/lib/router-data";

type Labels = {
  throughputTitle: string;
  resourcesTitle: string;
  dailyTitle: string;
  clientsTitle: string;
  clientsNote: string;
  down: string;
  up: string;
  cpu: string;
  mem: string;
  avgDown: string;
  avgUp: string;
  speedUnit: string;
};

type RouterChartsProps = {
  throughput: ThroughputPoint[];
  resources: ResourcePoint[];
  dailyThroughput: DailyThroughputPoint[];
  topClients: TopClientPoint[];
  labels: Labels;
};

const COLORS = { down: "#2563eb", up: "#14b8a6", cpu: "#f59e0b", mem: "#8b5cf6" };

const fmt = (value: number) =>
  value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });

// Colored-number tooltip, matching the electricity charts.
const tooltip =
  (suffix = "") =>
  ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ color?: string; value?: unknown; name?: unknown }>;
    label?: unknown;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="space-y-0.5 rounded-md border bg-background px-2.5 py-1.5 text-sm shadow-md">
        <div className="font-medium">{String(label ?? "")}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="tabular-nums">
              {fmt(Number(entry.value ?? 0))}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    );
  };

export function RouterCharts({
  throughput,
  resources,
  dailyThroughput,
  topClients,
  labels,
}: RouterChartsProps) {
  const clientData = topClients.map((c) => ({
    name: c.name,
    down: Math.round(c.downKB / 1024),
    up: Math.round(c.upKB / 1024),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{labels.throughputTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <AreaChart data={throughput}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" minTickGap={40} />
                <YAxis />
                <Tooltip content={tooltip(` ${labels.speedUnit}`)} />
                <Legend />
                <Area dataKey="down" name={labels.down} type="monotone" stroke={COLORS.down} fill={COLORS.down} fillOpacity={0.15} />
                <Area dataKey="up" name={labels.up} type="monotone" stroke={COLORS.up} fill={COLORS.up} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.resourcesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <LineChart data={resources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" minTickGap={40} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip content={tooltip("%")} />
                <Legend />
                <Line dataKey="cpu" name={labels.cpu} type="monotone" stroke={COLORS.cpu} dot={false} />
                <Line dataKey="mem" name={labels.mem} type="monotone" stroke={COLORS.mem} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.dailyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <BarChart data={dailyThroughput}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={20} />
                <YAxis />
                <Tooltip content={tooltip(` ${labels.speedUnit}`)} />
                <Legend />
                <Bar dataKey="avgDown" name={labels.avgDown} fill={COLORS.down} radius={[2, 2, 0, 0]} />
                <Bar dataKey="avgUp" name={labels.avgUp} fill={COLORS.up} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.clientsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
              <BarChart data={clientData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip content={tooltip(" MB")} />
                <Legend />
                <Bar dataKey="down" name={labels.down} stackId="c" fill={COLORS.down} />
                <Bar dataKey="up" name={labels.up} stackId="c" fill={COLORS.up} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">{labels.clientsNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
