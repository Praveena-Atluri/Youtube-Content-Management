"use client";

import { useState, useTransition } from "react";
import { DatabaseZap, LoaderCircle, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type YoutubeSyncActionsProps = {
  channelId: string;
  startDate: string;
  endDate: string;
  monthLabel: string;
  disabled?: boolean;
};

type SyncPayload = {
  status?: string;
  channelsSynced?: number;
  videosSynced?: number;
  metricsRowsSynced?: number;
  warnings?: string[];
  error?: string;
};

export function YoutubeSyncActions({
  channelId,
  startDate,
  endDate,
  monthLabel,
  disabled = false
}: YoutubeSyncActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const runSync = (backfill: boolean) => {
    startTransition(async () => {
      setMessage(null);

      const response = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          backfill ? { backfill: true, channelId } : { channelId, startDate, endDate, includePreviousMonth: true }
        )
      });

      const payload = (await response.json()) as SyncPayload;
      if (!response.ok) {
        setMessage(payload.error ?? "Sync failed.");
        return;
      }

      const warnings = payload.warnings?.length ? ` ${payload.warnings.length} warning(s).` : "";
      setMessage(
        `${payload.channelsSynced ?? 0} channels, ${payload.videosSynced ?? 0} videos, ${payload.metricsRowsSynced ?? 0} metric rows synced.${warnings}`
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          className="h-11 rounded-md"
          onClick={() => runSync(false)}
          disabled={disabled || isPending}
          type="button"
        >
          {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />}
          Sync {monthLabel}
        </Button>
        <Button
          className="h-11 rounded-md"
          onClick={() => runSync(true)}
          disabled={disabled || isPending}
          type="button"
          variant="secondary"
        >
          {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <DatabaseZap className="mr-2 size-4" />}
          Backfill 24 months
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
