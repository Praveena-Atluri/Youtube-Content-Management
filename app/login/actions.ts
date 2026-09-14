"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAccessConfig, isAllowedEmail, isSafeNextPath } from "@/lib/access-policy";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export type EmailAuthorizationState = {
  email: string;
  message: string;
  status: "idle" | "error" | "authorized";
};

export async function checkEmailAuthorization(
  _previousState: EmailAuthorizationState,
  formData: FormData
): Promise<EmailAuthorizationState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const accessConfig = getAccessConfig();

  if (!accessConfig.isConfigured) {
    return {
      email,
      message: "Access control is not configured. Please contact Admin.",
      status: "error"
    };
  }

  if (!isAllowedEmail(email, accessConfig.allowedEmails)) {
    return {
      email,
      message: "This email address is not authorized. Please contact Admin.",
      status: "error"
    };
  }

  return { email, message: "Email authorized.", status: "authorized" };
}

async function buildCallbackUrl(next: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return null;
  }

  const callbackUrl = new URL("/auth/callback", `${protocol}://${host}`);
  callbackUrl.searchParams.set("next", next);
  return callbackUrl;
}

export async function signInWithGoogle(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestedNext = String(formData.get("next") ?? "");
  const next = isSafeNextPath(requestedNext) ? requestedNext : "/";
  const accessConfig = getAccessConfig();
  const loginUrl = new URLSearchParams({ next });

  if (!accessConfig.isConfigured) {
    loginUrl.set("error", "config");
    redirect(`/login?${loginUrl.toString()}`);
  }

  if (!isAllowedEmail(email, accessConfig.allowedEmails)) {
    loginUrl.set("error", "domain");
    redirect(`/login?${loginUrl.toString()}`);
  }

  const callbackUrl = await buildCallbackUrl(next);
  if (!callbackUrl) {
    loginUrl.set("error", "oauth");
    redirect(`/login?${loginUrl.toString()}`);
  }

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { login_hint: email },
      skipBrowserRedirect: true
    }
  });

  if (error || !data.url) {
    console.error("Google sign-in failed", error?.message ?? "Missing authorization URL");
    loginUrl.set("error", "oauth");
    redirect(`/login?${loginUrl.toString()}`);
  }

  redirect(data.url);
}
