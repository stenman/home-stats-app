import { NextResponse } from "next/server";
import { getCollectorEnabled, setCollectorEnabled } from "@/lib/router-data";

export async function GET() {
  return NextResponse.json({ enabled: await getCollectorEnabled() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Expected { enabled: boolean }" }, { status: 400 });
  }
  await setCollectorEnabled(body.enabled);
  return NextResponse.json({ enabled: body.enabled });
}
