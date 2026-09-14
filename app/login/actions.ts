"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAccessConfig, isAllowedEmail, isSafeNextPath } from "@/lib/access-policy";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export type LoginState = {
  message: string;
  status: "idle" | "error" | "success";
};

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

export async function requestMagicLink(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestedNext = String(formData.get("next") ?? "");
  const next = isSafeNextPath(requestedNext) ? requestedNext : "/";
  const accessConfig = getAccessConfig();

  if (!accessConfig.isConfigured) {
    return { status: "error", message: "Access control is not configured. Contact the administrator." };
  }

  if (!isAllowedEmail(email, accessConfig.allowedEmails)) {
    return { status: "error", message: "Use an approved email address." };
  }

  const callbackUrl = await buildCallbackUrl(next);
  if (!callbackUrl) {
    return { status: "error", message: "Unable to determine the sign-in callback URL." };
  }

  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error("Magic-link request failed", error.message);
      return { status: "error", message: "We could not send the sign-in link. Try again." };
    }
  } catch (error) {
    console.error("Magic-link request failed", error);
    return { status: "error", message: "Sign-in is temporarily unavailable." };
  }

  return { status: "success", message: "Check your email for the sign-in link." };
}

export async function signInWithGoogle(formData: FormData) {
  const requestedNext = String(formData.get("next") ?? "");
  const next = isSafeNextPath(requestedNext) ? requestedNext : "/";
  const accessConfig = getAccessConfig();
  const loginUrl = new URLSearchParams({ next });

  if (!accessConfig.isConfigured) {
    loginUrl.set("error", "config");
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
