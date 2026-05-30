import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "chores-data.json");
const STATE_FILE = path.join(DATA_DIR, "chores-state.json");
const POINTS_FILE = path.join(DATA_DIR, "chores-points.json");
const HISTORY_FILE = path.join(DATA_DIR, "chores-history.json");

type HistoryEntry = {
  userId: string;
  choreId: string;
  points: number;
  at: string;
};

const MANUAL_ADJUSTMENT_CHORE_ID = "manual-adjustment";

function deriveCounts(history: HistoryEntry[]) {
  const counts: Record<string, Record<string, number>> = {};
  for (const entry of history) {
    if (entry.choreId === MANUAL_ADJUSTMENT_CHORE_ID) continue;
    if (!counts[entry.userId]) counts[entry.userId] = {};
    counts[entry.userId][entry.choreId] = (counts[entry.userId][entry.choreId] || 0) + 1;
  }
  return counts;
}

function deriveLastDoneBy(history: HistoryEntry[]) {
  const last: Record<string, { userId: string; at: string }> = {};
  for (const entry of history) {
    if (entry.choreId === MANUAL_ADJUSTMENT_CHORE_ID) continue;
    const prev = last[entry.choreId];
    if (!prev || entry.at > prev.at) {
      last[entry.choreId] = { userId: entry.userId, at: entry.at };
    }
  }
  return last;
}

async function readJson(filePath: string, defaultValue: any = {}) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

async function writeJson(filePath: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const tasks = await readJson(DATA_FILE, []);
  const states = await readJson(STATE_FILE, {});
  const points = await readJson(POINTS_FILE, {});
  const history = (await readJson(HISTORY_FILE, [])) as HistoryEntry[];

  const chores = tasks.map((task: any) => {
    const state = states[task.id] || { status: "ready", assignee: null };
    return {
      ...task,
      status: state.status,
      assignee: state.assignee,
    };
  });

  return NextResponse.json({
    chores,
    points,
    counts: deriveCounts(history),
    lastDoneBy: deriveLastDoneBy(history),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, choreId, assignee: assigneeName } = body;
    let assignee = assigneeName;
    if (assignee) {
      const users = await readJson(path.join(DATA_DIR, "chores-users.json"), []);
      const user = users.find((u: any) => u.name === assignee);
      if (user) assignee = String(user.id);
    }

    const tasks = await readJson(DATA_FILE, []);
    const states = await readJson(STATE_FILE, {});
    const points = await readJson(POINTS_FILE, {});
    const history = (await readJson(HISTORY_FILE, [])) as HistoryEntry[];
    let historyChanged = false;

    if (action === "set-chore-points") {
      const { points: newPoints } = body;
      if (typeof choreId !== "string" || !choreId) {
        return NextResponse.json({ error: "choreId is required" }, { status: 400 });
      }
      if (!Number.isFinite(newPoints) || !Number.isInteger(newPoints) || newPoints < 0) {
        return NextResponse.json({ error: "points must be a non-negative integer" }, { status: 400 });
      }
      const idx = tasks.findIndex((t: any) => t.id === choreId);
      if (idx === -1) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      if (tasks[idx].points !== newPoints) {
        tasks[idx].points = newPoints;
        await writeJson(DATA_FILE, tasks);
      }
      const chores = tasks.map((t: any) => {
        const s = states[t.id] || { status: "ready", assignee: null };
        return { ...t, status: s.status, assignee: s.assignee };
      });
      return NextResponse.json({
        chores,
        points,
        counts: deriveCounts(history),
        lastDoneBy: deriveLastDoneBy(history),
      });
    }

    if (action === "adjust") {
      const { userId, delta, setTo } = body;
      if (typeof userId !== "string" || !userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }
      const hasDelta = typeof delta === "number";
      const hasSetTo = typeof setTo === "number";
      if (hasDelta === hasSetTo) {
        return NextResponse.json({ error: "Provide exactly one of delta or setTo" }, { status: 400 });
      }
      const value = hasDelta ? delta : setTo;
      if (!Number.isFinite(value) || !Number.isInteger(value)) {
        return NextResponse.json({ error: "delta/setTo must be a finite integer" }, { status: 400 });
      }
      if (points[userId] === undefined) points[userId] = 0;
      const currentPoints = points[userId];
      const effectiveDelta = hasSetTo ? setTo - currentPoints : delta;

      if (effectiveDelta !== 0) {
        points[userId] = currentPoints + effectiveDelta;
        history.push({
          userId,
          choreId: MANUAL_ADJUSTMENT_CHORE_ID,
          points: effectiveDelta,
          at: new Date().toISOString(),
        });
        await writeJson(POINTS_FILE, points);
        await writeJson(HISTORY_FILE, history);
      }

      const chores = tasks.map((t: any) => {
        const s = states[t.id] || { status: "ready", assignee: null };
        return { ...t, status: s.status, assignee: s.assignee };
      });
      return NextResponse.json({
        chores,
        points,
        counts: deriveCounts(history),
        lastDoneBy: deriveLastDoneBy(history),
      });
    }

    const task = tasks.find((t: any) => t.id === choreId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const state = states[choreId] || { status: "ready", assignee: null };

    switch (action) {
      case "start":
        if (state.status !== "ready") {
          return NextResponse.json({ error: "Chore must be ready to start" }, { status: 400 });
        }
        if (!assignee) {
          return NextResponse.json({ error: "Assignee is required" }, { status: 400 });
        }
        state.status = "started";
        state.assignee = assignee;
        if (points[assignee] === undefined) {
          points[assignee] = 0;
        }
        break;

      case "finish":
        if (state.status !== "started") {
          return NextResponse.json({ error: "Chore must be started to finish" }, { status: 400 });
        }
        state.status = "finished";
        break;

      case "cancel":
        if (state.status !== "started") {
          return NextResponse.json({ error: "Chore must be started to cancel" }, { status: 400 });
        }
        state.status = "ready";
        state.assignee = null;
        break;

      case "inspect":
        if (state.status !== "finished") {
          return NextResponse.json({ error: "Chore must be finished to inspect" }, { status: 400 });
        }
        state.status = "inspected";
        if (state.assignee && points[state.assignee] !== undefined) {
          points[state.assignee] += task.points;
          history.push({
            userId: state.assignee,
            choreId,
            points: task.points,
            at: new Date().toISOString(),
          });
          historyChanged = true;
        }
        break;

      case "reset":
        if (state.status !== "inspected") {
          return NextResponse.json({ error: "Chore must be inspected to reset" }, { status: 400 });
        }
        state.status = "ready";
        state.assignee = null;
        break;

      case "redo":
        if (state.status !== "finished") {
          return NextResponse.json({ error: "Chore must be finished to redo" }, { status: 400 });
        }
        state.status = "ready";
        state.assignee = null;
        // No points awarded for redo
        break;

      case "unready":
        if (state.status !== "ready") {
          return NextResponse.json({ error: "Chore must be ready to unready" }, { status: 400 });
        }
        state.status = "inspected";
        state.assignee = null;
        break;

      default:


        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    states[choreId] = state;
    await writeJson(STATE_FILE, states);
    await writeJson(POINTS_FILE, points);
    if (historyChanged) {
      await writeJson(HISTORY_FILE, history);
    }

    const chores = tasks.map((t: any) => {
      const s = states[t.id] || { status: "ready", assignee: null };
      return {
        ...t,
        status: s.status,
        assignee: s.assignee,
      };
    });

    return NextResponse.json({
      chores,
      points,
      counts: deriveCounts(history),
      lastDoneBy: deriveLastDoneBy(history),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
