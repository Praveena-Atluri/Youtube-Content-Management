import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedSyncRequest } from "@/lib/request-access";
import { syncFeeds } from "@/lib/sync-feeds";

export const dynamic = "force-dynamic";

let syncInProgress = false;

export async function POST(request: NextRequest) {
  if (!isAuthorizedSyncRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (syncInProgress) {
    return NextResponse.json({ error: "Sync already in progress." }, { status: 409 });
  }

  syncInProgress = true;
  try {
    const result = await syncFeeds();
    return NextResponse.json(result);
  } finally {
    syncInProgress = false;
  }
}
