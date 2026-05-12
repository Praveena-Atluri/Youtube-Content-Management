import { NextRequest, NextResponse } from "next/server";

import { syncFeeds } from "@/lib/sync-feeds";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFeeds();
  return NextResponse.json(result);
}
