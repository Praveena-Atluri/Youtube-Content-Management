"use server";

import { headers } from "next/headers";

import { getAccessConfig, isAllowedEmail, isSafeNextPath } from "@/lib/access-policy";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export type LoginState = {
  message: string;
  status: "idle" | "error" | "success";
};

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

  if (!isAllowedEmail(email, accessConfig.allowedEmailDomains, accessConfig.allowedEmails)) {
    return { status: "error", message: "Use an approved email address." };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) {
    return { status: "error", message: "Unable to determine the sign-in callback URL." };
  }

  const callbackUrl = new URL("/auth/callback", `${protocol}://${host}`);
  callbackUrl.searchParams.set("next", next);

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

  return { status: "success", message: "Check your company email for the sign-in link." };
}
