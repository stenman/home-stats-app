import { promises as fs } from "fs";
import path from "path";

// These shapes are the contract written by scripts/deco-collector.py.
// Keep field names in sync with that script.

export type RouterNode = {
  mac: string;
  nickname: string;
  model: string;
  role: string; // master | slave
  firmware: string;
  hardware: string;
  inetStatus: string;
  signal2g: number | null;
  signal5g: number | null;
};

export type RouterClientSample = {
  mac: string;
  name: string;
  ip: string;
  conn: string;
  interface: string;
  downSpeed: number;
  upSpeed: number;
};

export type RouterSample = {
  ts: string;
  cpuUsage: number | null; // 0..1
  memUsage: number | null; // 0..1
  totals: {
    downSpeed: number;
    upSpeed: number;
    clients: number;
    wired: number;
    wifi: number;
    guest: number;
  };
  nodes: RouterNode[];
  clients: RouterClientSample[];
};

export type RouterDailyClient = {
  mac: string;
  name: string;
  downKB: number;
  upKB: number;
  samples: number;
};

export type RouterDailyRecord = {
  date: string;
  samples: number;
  avgDownSpeed: number;
  avgUpSpeed: number;
  peakDownSpeed: number;
  peakUpSpeed: number;
  avgCpu: number | null;
  avgMem: number | null;
  maxCpu: number | null;
  maxMem: number | null;
  clients: RouterDailyClient[];
};

export type ThroughputPoint = { t: string; down: number; up: number };
export type ResourcePoint = { t: string; cpu: number; mem: number };
export type DailyThroughputPoint = {
  date: string;
  avgDown: number;
  avgUp: number;
  peakDown: number;
  peakUp: number;
};
export type TopClientPoint = { name: string; downKB: number; upKB: number };

export type RouterDashboardData = {
  hasData: boolean;
  latest: {
    ts: string;
    totals: RouterSample["totals"];
    cpuUsage: number | null;
    memUsage: number | null;
    nodes: RouterNode[];
  } | null;
  throughput: ThroughputPoint[];
  resources: ResourcePoint[];
  dailyThroughput: DailyThroughputPoint[];
  topClients: TopClientPoint[];
};

const STATS_FILE = path.join(process.cwd(), "data", "router-stats.json");
const DAILY_FILE = path.join(process.cwd(), "data", "router-daily.json");
const COLLECTOR_STATE_FILE = path.join(process.cwd(), "data", "router-collector.json");

// Shared on/off switch for the scheduled collector. The UI writes it here and the
// Python collector reads the same file before each run. Absent file => enabled.
export async function getCollectorEnabled(): Promise<boolean> {
  try {
    const raw = await fs.readFile(COLLECTOR_STATE_FILE, "utf-8");
    return JSON.parse(raw)?.enabled !== false;
  } catch {
    return true;
  }
}

export async function setCollectorEnabled(enabled: boolean): Promise<void> {
  await fs.mkdir(path.dirname(COLLECTOR_STATE_FILE), { recursive: true });
  await fs.writeFile(COLLECTOR_STATE_FILE, JSON.stringify({ enabled }, null, 2), "utf-8");
}

async function readArray<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );

const emptyDashboard: RouterDashboardData = {
  hasData: false,
  latest: null,
  throughput: [],
  resources: [],
  dailyThroughput: [],
  topClients: [],
};

export async function getRouterDashboardData(): Promise<RouterDashboardData> {
  const [samples, daily] = await Promise.all([
    readArray<RouterSample>(STATS_FILE),
    readArray<RouterDailyRecord>(DAILY_FILE),
  ]);

  if (samples.length === 0 && daily.length === 0) {
    return emptyDashboard;
  }

  const sorted = [...samples].sort((a, b) => a.ts.localeCompare(b.ts));
  const latest = sorted[sorted.length - 1] ?? null;

  const throughput: ThroughputPoint[] = sorted.map((s) => ({
    t: timeLabel(s.ts),
    down: s.totals.downSpeed,
    up: s.totals.upSpeed,
  }));

  const resources: ResourcePoint[] = sorted
    .filter((s) => s.cpuUsage !== null || s.memUsage !== null)
    .map((s) => ({
      t: timeLabel(s.ts),
      cpu: Math.round((s.cpuUsage ?? 0) * 100),
      mem: Math.round((s.memUsage ?? 0) * 100),
    }));

  const dailySorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const dailyThroughput: DailyThroughputPoint[] = dailySorted.map((d) => ({
    date: d.date,
    avgDown: d.avgDownSpeed,
    avgUp: d.avgUpSpeed,
    peakDown: d.peakDownSpeed,
    peakUp: d.peakUpSpeed,
  }));

  // Aggregate estimated usage per client across all daily records.
  const byClient = new Map<string, TopClientPoint>();
  for (const day of dailySorted) {
    for (const c of day.clients) {
      const key = c.mac || c.name;
      const entry = byClient.get(key) ?? { name: c.name || c.mac, downKB: 0, upKB: 0 };
      entry.name = c.name || entry.name;
      entry.downKB += c.downKB;
      entry.upKB += c.upKB;
      byClient.set(key, entry);
    }
  }
  const topClients = Array.from(byClient.values())
    .sort((a, b) => b.downKB + b.upKB - (a.downKB + a.upKB))
    .slice(0, 12)
    .map((c) => ({ name: c.name, downKB: Math.round(c.downKB), upKB: Math.round(c.upKB) }));

  return {
    hasData: true,
    latest: latest
      ? {
          ts: latest.ts,
          totals: latest.totals,
          cpuUsage: latest.cpuUsage,
          memUsage: latest.memUsage,
          nodes: latest.nodes,
        }
      : null,
    throughput,
    resources,
    dailyThroughput,
    topClients,
  };
}
