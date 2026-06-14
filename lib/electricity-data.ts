import { promises as fs } from "fs";
import path from "path";
import type { StoredElectricityRow } from "@/lib/electricity-import";

export type { StoredElectricityRow };

export type MonthlyElectricityPoint = StoredElectricityRow & {
  month: string;
};

export type ElectricitySummary = {
  totalCostSek: number;
  totalSettledKwh: number;
  averageCostSekPerMonth: number;
  averageSettledKwhPerMonth: number;
};

export type ElectricityDashboardData = {
  summary: ElectricitySummary;
  monthly: MonthlyElectricityPoint[];
  availableYears: number[];
  selectedYear: number;
  yearlySummary: {
    totalAnnualCostSek: number;
    annualElectricitySupplierSek: number;
    annualGridFeesSek: number;
    totalAnnualSettledKwh: number;
    averageTotalPriceInclVatOrePerKwh: number;
  } | null;
};

const DATA_FILE = path.join(process.cwd(), "data", "electricity-data.json");

async function readStoredRows(): Promise<StoredElectricityRow[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredElectricityRow[]) : [];
  } catch {
    return [];
  }
}

const emptyDashboard: ElectricityDashboardData = {
  summary: {
    totalCostSek: 0,
    totalSettledKwh: 0,
    averageCostSekPerMonth: 0,
    averageSettledKwhPerMonth: 0,
  },
  monthly: [],
  availableYears: [],
  selectedYear: 0,
  yearlySummary: null,
};

export async function getElectricityDashboardData(
  preferredYear?: number
): Promise<ElectricityDashboardData> {
  const rows = await readStoredRows();
  if (rows.length === 0) {
    return emptyDashboard;
  }

  const allMonthly: MonthlyElectricityPoint[] = rows.map((row) => {
    const date = new Date(`${row.dateFrom}T00:00:00`);
    const monthLabel = new Intl.DateTimeFormat("sv-SE", {
      month: "short",
      year: "2-digit",
    })
      .format(date)
      .replace(".", "");
    return {
      month: monthLabel,
      ...row,
    };
  });

  const availableYears = Array.from(
    new Set(allMonthly.map((item) => Number(item.dateFrom.slice(0, 4))))
  ).sort((a, b) => a - b);
  const fallbackYear = availableYears[availableYears.length - 1];
  const selectedYear =
    preferredYear && availableYears.includes(preferredYear) ? preferredYear : fallbackYear;
  const monthly = allMonthly.filter((item) => item.dateFrom.startsWith(`${selectedYear}-`));
  const yearRows = monthly;

  return {
    summary: {
      totalCostSek: monthly.reduce((sum, item) => sum + item.totalCostSek, 0),
      totalSettledKwh: monthly.reduce((sum, item) => sum + item.settledKwh, 0),
      averageCostSekPerMonth:
        monthly.reduce((sum, item) => sum + item.totalCostSek, 0) / monthly.length,
      averageSettledKwhPerMonth:
        monthly.reduce((sum, item) => sum + item.settledKwh, 0) / monthly.length,
    },
    monthly,
    availableYears,
    selectedYear,
    yearlySummary: yearRows.length
      ? {
          totalAnnualCostSek: yearRows.reduce((sum, item) => sum + item.totalCostSek, 0),
          annualElectricitySupplierSek: yearRows.reduce(
            (sum, item) => sum + item.electricitySupplierSek,
            0
          ),
          annualGridFeesSek: yearRows.reduce((sum, item) => sum + item.gridFeesSek, 0),
          totalAnnualSettledKwh: yearRows.reduce((sum, item) => sum + item.settledKwh, 0),
          averageTotalPriceInclVatOrePerKwh:
            yearRows.reduce((sum, item) => sum + item.totalPriceInclVatOrePerKwh, 0) /
            yearRows.length,
        }
      : null,
  };
}

export type YearlyElectricityPoint = {
  year: number;
  monthsCount: number;
  totalAnnualCostSek: number; // Årskostnad totalt
  totalAnnualSettledKwh: number; // Årsförbrukning total
  annualElectricitySupplierSek: number; // Årskostnad elavgifter
  annualGridFeesSek: number; // Årskostnad nätavgifter
  avgEnergyFeeOrePerKwh: number; // Medelvärde öre/kWh (elavgifter)
  avgTotalPriceOrePerKwh: number; // Medelvärde öre/kWh (total)
  avgElectricitySupplierSek: number; // Medelvärde elavgifter
  avgGridFeesSek: number; // Medelvärde nätavgifter
  avgTotalCostSek: number; // Medelvärde total kostnad
};

export async function getElectricityYearlyData(): Promise<YearlyElectricityPoint[]> {
  const rows = await readStoredRows();
  if (rows.length === 0) return [];

  const byYear = new Map<number, StoredElectricityRow[]>();
  for (const row of rows) {
    const year = Number(row.dateFrom.slice(0, 4));
    const group = byYear.get(year);
    if (group) group.push(row);
    else byYear.set(year, [row]);
  }

  const sum = (group: StoredElectricityRow[], pick: (r: StoredElectricityRow) => number) =>
    group.reduce((acc, r) => acc + pick(r), 0);

  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, group]) => {
      const months = group.length;
      return {
        year,
        monthsCount: months,
        totalAnnualCostSek: sum(group, (r) => r.totalCostSek),
        totalAnnualSettledKwh: sum(group, (r) => r.settledKwh),
        annualElectricitySupplierSek: sum(group, (r) => r.electricitySupplierSek),
        annualGridFeesSek: sum(group, (r) => r.gridFeesSek),
        avgEnergyFeeOrePerKwh: sum(group, (r) => r.energyFeeInclVatOrePerKwh) / months,
        avgTotalPriceOrePerKwh: sum(group, (r) => r.totalPriceInclVatOrePerKwh) / months,
        avgElectricitySupplierSek: sum(group, (r) => r.electricitySupplierSek) / months,
        avgGridFeesSek: sum(group, (r) => r.gridFeesSek) / months,
        avgTotalCostSek: sum(group, (r) => r.totalCostSek) / months,
      };
    });
}

export type ElectricityComment = { date: string; label: string; comment: string };

export async function getElectricityComments(): Promise<ElectricityComment[]> {
  const rows = await readStoredRows();
  return rows
    .filter((r): r is StoredElectricityRow & { comment: string } =>
      Boolean(r.comment && r.comment.trim() !== "")
    )
    .map((r) => {
      const date = new Date(`${r.dateFrom}T00:00:00`);
      const label = new Intl.DateTimeFormat("sv-SE", {
        month: "short",
        year: "numeric",
      })
        .format(date)
        .replace(".", "");
      return { date: r.dateFrom, label, comment: r.comment };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}
