import { NextRequest, NextResponse } from "next/server";

import {
  getBackfillDateRange,
  getDefaultSyncDateRange,
  syncYoutubeCmsAnalytics
} from "@/lib/youtube-performance-sync";

export const dynamic = "force-dynamic";

let youtubeSyncInProgress = false;

type SyncRequestBody = {
  channelId?: string;
  startDate?: string;
  endDate?: string;
  backfill?: boolean;
  includePreviousMonth?: boolean;
};

export async function POST(request: NextRequest) {
  if (youtubeSyncInProgress) {
    return NextResponse.json({ error: "YouTube sync already in progress." }, { status: 409 });
  }

  let body: SyncRequestBody = {};
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    body = {};
  }

  const fallbackRange = body.backfill ? getBackfillDateRange() : getDefaultSyncDateRange();
  const requestedStartDate = body.startDate ?? fallbackRange.startDate;
  const endDate = body.endDate ?? fallbackRange.endDate;
  const channelId = body.channelId?.trim();

  if (!channelId || channelId === "all") {
    return NextResponse.json({ error: "Select one channel before running YouTube sync." }, { status: 400 });
  }

  if (!isValidReportDate(requestedStartDate) || !isValidReportDate(endDate)) {
    return NextResponse.json(
      { error: "startDate and endDate must use YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const startDate =
    body.includePreviousMonth && body.startDate && !body.backfill
      ? getPreviousMonthStartDate(requestedStartDate)
      : requestedStartDate;

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return NextResponse.json({ error: "startDate must be before or equal to endDate." }, { status: 400 });
  }

  youtubeSyncInProgress = true;

  try {
    const result = await syncYoutubeCmsAnalytics({
      channelId,
      startDate,
      endDate,
      syncType: body.backfill ? "backfill" : body.startDate || body.endDate ? "manual" : "daily"
    });
    return NextResponse.json({
      ...result,
      startDate,
      endDate,
      requestedStartDate,
      includedPreviousMonth: startDate !== requestedStartDate
    });
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message, startDate, endDate, requestedStartDate }, { status: 500 });
  } finally {
    youtubeSyncInProgress = false;
  }
}

function isValidReportDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getPreviousMonthStartDate(startDate: string) {
  const [year, month] = startDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown YouTube sync error";
  }
}
