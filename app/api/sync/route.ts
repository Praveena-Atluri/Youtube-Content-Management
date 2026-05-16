import { NextResponse } from "next/server";

import { syncFeeds } from "@/lib/sync-feeds";

export const dynamic = "force-dynamic";

let syncInProgress = false;

export async function POST() {
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
