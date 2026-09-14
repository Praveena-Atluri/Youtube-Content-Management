import type { NextRequest } from "next/server";

import { INTERNAL_ACCESS_HEADER, secretsMatch } from "@/lib/access-policy";

const TRUSTED_ACCESS_VALUES = new Set(["employee", "development", "automation"]);

export function hasInternalAccess(request: NextRequest) {
  return TRUSTED_ACCESS_VALUES.has(request.headers.get(INTERNAL_ACCESS_HEADER) ?? "");
}

export function hasAutomationSecret(request: NextRequest) {
  return secretsMatch(request.headers.get("x-cron-secret"), process.env.CRON_SECRET);
}

export function isAuthorizedSyncRequest(request: NextRequest) {
  return hasInternalAccess(request) || hasAutomationSecret(request);
}
