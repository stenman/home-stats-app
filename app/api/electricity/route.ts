import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parseElectricityTsv } from "@/lib/electricity-import";

const DATA_DIR = path.join(process.cwd(), "data");
const ELECTRICITY_FILE = path.join(DATA_DIR, "electricity-data.json");

export async function POST(request: Request) {
  const text = await request.text();
  if (!text.trim()) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseElectricityTsv(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse the file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ELECTRICITY_FILE, JSON.stringify(parsed.rows, null, 2), "utf-8");

  const years = Array.from(
    new Set(parsed.rows.map((row) => Number(row.dateFrom.slice(0, 4))))
  ).sort((a, b) => a - b);

  return NextResponse.json({
    imported: parsed.rows.length,
    years,
    warnings: parsed.warnings,
  });
}
