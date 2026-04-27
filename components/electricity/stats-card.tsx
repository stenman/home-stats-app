import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string;
  trendPercent?: number;
};

export function StatsCard({ title, value, trendPercent }: StatsCardProps) {
  const hasTrend = typeof trendPercent === "number";
  const isPositive = (trendPercent ?? 0) >= 0;
  const trendColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const trendPrefix = isPositive ? "+" : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {hasTrend ? (
          <p className={`mt-2 text-sm ${trendColor}`}>
            {trendPrefix}
            {trendPercent.toFixed(1)}%
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
