export type StoredElectricityRow = {
  dateFrom: string;
  dateTo: string;
  energyFeeInclVatOrePerKwh: number;
  energyTaxInclVatOrePerKwh: number;
  transferInclVatOrePerKwh: number;
  electricitySupplierSek: number;
  gridFeesSek: number;
  totalCostSek: number;
  settledKwh: number;
  totalPriceInclVatOrePerKwh: number;
  comment?: string;
};

// Maps each stored field to the (trimmed) TSV header it reads from.
// Headers are matched by name so extra spreadsheet columns are ignored and
// the import survives column reordering.
const HEADER_MAP: Record<keyof Omit<StoredElectricityRow, "comment">, string> = {
  dateFrom: "Datum från",
  dateTo: "Datum till",
  energyFeeInclVatOrePerKwh: "Energiavgift öre/kWh (inkl. moms) [Förbrukning]",
  energyTaxInclVatOrePerKwh: "Energiskatt öre/kWh (inkl. moms)",
  transferInclVatOrePerKwh: "Elöverföring öre/kWh (inkl. moms)",
  electricitySupplierSek: "El-leverantör  (inkl. fast avgift) [Summa Elhandel]",
  gridFeesSek: "Nätavgifter SEK [Summa Elnät]",
  totalCostSek: "Total kostnad SEK",
  settledKwh: "Summa avstämt (kW/h)",
  totalPriceInclVatOrePerKwh: "Kostnad öre/kWh (inkl. moms)",
};

const COMMENT_HEADER = "Kommentar";

const NUMERIC_FIELDS: (keyof Omit<StoredElectricityRow, "comment" | "dateFrom" | "dateTo">)[] = [
  "energyFeeInclVatOrePerKwh",
  "energyTaxInclVatOrePerKwh",
  "transferInclVatOrePerKwh",
  "electricitySupplierSek",
  "gridFeesSek",
  "totalCostSek",
  "settledKwh",
  "totalPriceInclVatOrePerKwh",
];

// Parses a Swedish-formatted number ("41,25" -> 41.25). Empty -> 0.
function parseNumber(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export type ParseResult = {
  rows: StoredElectricityRow[];
  warnings: string[];
};

export function parseElectricityTsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    throw new Error("The file has no data rows.");
  }

  const header = lines[0].split("\t").map((cell) => cell.trim());
  const columnIndex = (name: string) => header.findIndex((cell) => cell === name);

  // Resolve and validate required columns up front.
  const indices = {} as Record<keyof Omit<StoredElectricityRow, "comment">, number>;
  const missing: string[] = [];
  (Object.keys(HEADER_MAP) as (keyof typeof HEADER_MAP)[]).forEach((field) => {
    const idx = columnIndex(HEADER_MAP[field]);
    if (idx === -1) missing.push(HEADER_MAP[field]);
    indices[field] = idx;
  });
  if (missing.length > 0) {
    throw new Error(`Missing expected column(s): ${missing.join(", ")}`);
  }
  const commentIndex = columnIndex(COMMENT_HEADER);

  const rows: StoredElectricityRow[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split("\t");
    const get = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : "").trim();

    const dateFrom = get(indices.dateFrom);
    const dateTo = get(indices.dateTo);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      // Not a data row (e.g. trailing blank/garbage line).
      continue;
    }

    const numbers: Record<string, number> = {};
    let badNumber = false;
    for (const field of NUMERIC_FIELDS) {
      const value = parseNumber(get(indices[field]));
      if (Number.isNaN(value)) {
        badNumber = true;
        break;
      }
      numbers[field] = value;
    }
    if (badNumber) {
      warnings.push(`Row ${i + 1} (${dateFrom}) skipped: non-numeric value.`);
      continue;
    }

    // Skip empty/future placeholder rows: no consumption and no cost.
    if (numbers.settledKwh === 0 && numbers.totalCostSek === 0) {
      continue;
    }

    const comment = commentIndex >= 0 ? get(commentIndex) : "";
    const row: StoredElectricityRow = {
      dateFrom,
      dateTo,
      energyFeeInclVatOrePerKwh: numbers.energyFeeInclVatOrePerKwh,
      energyTaxInclVatOrePerKwh: numbers.energyTaxInclVatOrePerKwh,
      transferInclVatOrePerKwh: numbers.transferInclVatOrePerKwh,
      electricitySupplierSek: numbers.electricitySupplierSek,
      gridFeesSek: numbers.gridFeesSek,
      totalCostSek: numbers.totalCostSek,
      settledKwh: numbers.settledKwh,
      totalPriceInclVatOrePerKwh: numbers.totalPriceInclVatOrePerKwh,
      ...(comment ? { comment } : {}),
    };
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error("No valid data rows found in the file.");
  }

  rows.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  return { rows, warnings };
}
