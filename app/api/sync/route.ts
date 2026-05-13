import { NextResponse } from "next/server";

import { syncFeeds } from "@/lib/sync-feeds";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await syncFeeds();
  return NextResponse.json(result);
}
