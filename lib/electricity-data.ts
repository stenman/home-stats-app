export type MonthlyElectricityPoint = {
  month: string;
  dateFrom: string;
  dateTo: string;
  energyFeeInclVatOrePerKwh: number;
  energyTaxInclVatOrePerKwh: number;
  transferInclVatOrePerKwh: number;
  electricitySupplierSek: number;
  gridFeesSek: number;
  totalCostSek: number;
  settledKwh: number;
  comment?: string;
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
    averageEnergyFeeInclVatOrePerKwh: number;
  } | null;
};

const monthlyRows = [
  {
    dateFrom: "2024-01-01",
    dateTo: "2024-01-31",
    energyFeeInclVatOrePerKwh: 116,
    energyTaxInclVatOrePerKwh: 53.5,
    transferInclVatOrePerKwh: 34,
    electricitySupplierSek: 1611,
    gridFeesSek: 1579,
    totalCostSek: 3190,
    settledKwh: 1379,
    comment: "Vintertopp med hog forbrukning.",
  },
  {
    dateFrom: "2024-02-01",
    dateTo: "2024-02-29",
    energyFeeInclVatOrePerKwh: 73.4,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 852,
    gridFeesSek: 1334,
    totalCostSek: 2186,
    settledKwh: 1140,
  },
  {
    dateFrom: "2024-03-01",
    dateTo: "2024-03-31",
    energyFeeInclVatOrePerKwh: 84.6,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 936,
    gridFeesSek: 1352,
    totalCostSek: 2288,
    settledKwh: 1119,
  },
  {
    dateFrom: "2024-04-01",
    dateTo: "2024-04-30",
    energyFeeInclVatOrePerKwh: 72.2,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 754,
    gridFeesSek: 1216,
    totalCostSek: 1970,
    settledKwh: 977,
  },
  {
    dateFrom: "2024-05-01",
    dateTo: "2024-05-31",
    energyFeeInclVatOrePerKwh: 31.7,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 287,
    gridFeesSek: 1028,
    totalCostSek: 1315,
    settledKwh: 749,
  },
  {
    dateFrom: "2024-06-01",
    dateTo: "2024-06-30",
    energyFeeInclVatOrePerKwh: 36.5,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 279,
    gridFeesSek: 912,
    totalCostSek: 1191,
    settledKwh: 630,
  },
  {
    dateFrom: "2024-07-01",
    dateTo: "2024-07-31",
    energyFeeInclVatOrePerKwh: 27.1,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 237,
    gridFeesSek: 980,
    totalCostSek: 1217,
    settledKwh: 694,
  },
  {
    dateFrom: "2024-08-01",
    dateTo: "2024-08-31",
    energyFeeInclVatOrePerKwh: 14.2,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 152,
    gridFeesSek: 1008,
    totalCostSek: 1160,
    settledKwh: 726,
  },
  {
    dateFrom: "2024-09-01",
    dateTo: "2024-09-30",
    energyFeeInclVatOrePerKwh: 20.6,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 231,
    gridFeesSek: 1135,
    totalCostSek: 1366,
    settledKwh: 885,
  },
  {
    dateFrom: "2024-10-01",
    dateTo: "2024-10-31",
    energyFeeInclVatOrePerKwh: 25.8,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 336,
    gridFeesSek: 1349,
    totalCostSek: 1685,
    settledKwh: 1116,
  },
  {
    dateFrom: "2024-11-01",
    dateTo: "2024-11-30",
    energyFeeInclVatOrePerKwh: 81.6,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 1160,
    gridFeesSek: 1553,
    totalCostSek: 2713,
    settledKwh: 1362,
  },
  {
    dateFrom: "2024-12-01",
    dateTo: "2024-12-31",
    energyFeeInclVatOrePerKwh: 77.4,
    energyTaxInclVatOrePerKwh: 42.8,
    transferInclVatOrePerKwh: 27.2,
    electricitySupplierSek: 1127,
    gridFeesSek: 1591,
    totalCostSek: 2718,
    settledKwh: 1392,
    comment: "Arets sista avlasning.",
  },
  {
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    energyFeeInclVatOrePerKwh: 80.1,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 1267,
    gridFeesSek: 1856,
    totalCostSek: 3123,
    settledKwh: 1520,
  },
  {
    dateFrom: "2025-02-01",
    dateTo: "2025-02-28",
    energyFeeInclVatOrePerKwh: 98.4,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 1498,
    gridFeesSek: 1770,
    totalCostSek: 3268,
    settledKwh: 1473,
  },
  {
    dateFrom: "2025-03-01",
    dateTo: "2025-03-31",
    energyFeeInclVatOrePerKwh: 63.4,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 796,
    gridFeesSek: 1516,
    totalCostSek: 2312,
    settledKwh: 1158,
  },
  {
    dateFrom: "2025-04-01",
    dateTo: "2025-04-30",
    energyFeeInclVatOrePerKwh: 47,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 533,
    gridFeesSek: 1381,
    totalCostSek: 1914,
    settledKwh: 1029,
  },
  {
    dateFrom: "2025-05-01",
    dateTo: "2025-05-31",
    energyFeeInclVatOrePerKwh: 53,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 610,
    gridFeesSek: 1430,
    totalCostSek: 2040,
    settledKwh: 1066,
  },
  {
    dateFrom: "2025-06-01",
    dateTo: "2025-06-30",
    energyFeeInclVatOrePerKwh: 21,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 244,
    gridFeesSek: 1285,
    totalCostSek: 1529,
    settledKwh: 927,
  },
  {
    dateFrom: "2025-07-01",
    dateTo: "2025-07-31",
    energyFeeInclVatOrePerKwh: 43,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 417,
    gridFeesSek: 1234,
    totalCostSek: 1651,
    settledKwh: 858,
  },
  {
    dateFrom: "2025-08-01",
    dateTo: "2025-08-31",
    energyFeeInclVatOrePerKwh: 56,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 516,
    gridFeesSek: 1217,
    totalCostSek: 1733,
    settledKwh: 840,
  },
  {
    dateFrom: "2025-09-01",
    dateTo: "2025-09-30",
    energyFeeInclVatOrePerKwh: 67,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 711,
    gridFeesSek: 1345,
    totalCostSek: 2056,
    settledKwh: 991,
  },
  {
    dateFrom: "2025-10-01",
    dateTo: "2025-10-31",
    energyFeeInclVatOrePerKwh: 72,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 905,
    gridFeesSek: 1551,
    totalCostSek: 2456,
    settledKwh: 1195,
  },
  {
    dateFrom: "2025-11-01",
    dateTo: "2025-11-30",
    energyFeeInclVatOrePerKwh: 92,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 1296,
    gridFeesSek: 1659,
    totalCostSek: 2955,
    settledKwh: 1325,
  },
  {
    dateFrom: "2025-12-01",
    dateTo: "2025-12-31",
    energyFeeInclVatOrePerKwh: 65,
    energyTaxInclVatOrePerKwh: 43.9,
    transferInclVatOrePerKwh: 31.2,
    electricitySupplierSek: 927,
    gridFeesSek: 1430,
    totalCostSek: 2357,
    settledKwh: 1066,
    comment: "Preliminar decemberavlasning.",
  },
];

export async function getElectricityDashboardData(
  preferredYear?: number
): Promise<ElectricityDashboardData> {
  const allMonthly: MonthlyElectricityPoint[] = monthlyRows.map((row) => {
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
          averageEnergyFeeInclVatOrePerKwh:
            yearRows.reduce((sum, item) => sum + item.energyFeeInclVatOrePerKwh, 0) /
            yearRows.length,
        }
      : null,
  };
}
