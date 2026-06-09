import { NextResponse } from "next/server";

import {
  listStoredYoutubeManagedChannels,
  refreshYoutubeManagedChannelCatalog
} from "@/lib/youtube-managed-channels";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await listStoredYoutubeManagedChannels();
    return NextResponse.json({ channels, channelCount: channels.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load YouTube CMS channels.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const channels = await refreshYoutubeManagedChannelCatalog();
    return NextResponse.json({ channels, channelCount: channels.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to refresh YouTube CMS channels.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
