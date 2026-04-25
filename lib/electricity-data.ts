export type MonthlyElectricityPoint = {
  month: string;
  costSek: number;
  consumptionKwh: number;
};

export type ElectricitySummary = {
  totalCostSek: number;
  totalConsumptionKwh: number;
  averagePriceSekPerKwh: number;
  costTrendPercent: number;
  consumptionTrendPercent: number;
  averagePriceTrendPercent: number;
};

export type ElectricityDashboardData = {
  summary: ElectricitySummary;
  monthly: MonthlyElectricityPoint[];
};

const monthlyData: MonthlyElectricityPoint[] = [
  { month: "Jan", costSek: 1280, consumptionKwh: 620 },
  { month: "Feb", costSek: 1175, consumptionKwh: 590 },
  { month: "Mar", costSek: 1090, consumptionKwh: 550 },
  { month: "Apr", costSek: 980, consumptionKwh: 510 },
  { month: "May", costSek: 890, consumptionKwh: 470 },
  { month: "Jun", costSek: 760, consumptionKwh: 410 },
];

export async function getElectricityDashboardData(): Promise<ElectricityDashboardData> {
  // Stub for upcoming Supabase integration.
  return {
    summary: {
      totalCostSek: monthlyData.reduce((sum, item) => sum + item.costSek, 0),
      totalConsumptionKwh: monthlyData.reduce(
        (sum, item) => sum + item.consumptionKwh,
        0
      ),
      averagePriceSekPerKwh: 1.93,
      costTrendPercent: -4.8,
      consumptionTrendPercent: -3.1,
      averagePriceTrendPercent: 1.4,
    },
    monthly: monthlyData,
  };
}
