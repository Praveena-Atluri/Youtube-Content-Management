import { NextRequest, NextResponse } from "next/server";

import { getAccessConfig, isAllowedEmail, isSafeNextPath } from "@/lib/access-policy";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = isSafeNextPath(requestedNext) ? requestedNext! : "/";
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", next);

  if (!code) {
    loginUrl.searchParams.set("error", "callback");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const { data } = await supabase.auth.getUser();
    const config = getAccessConfig();
    if (
      !data.user ||
      !isAllowedEmail(data.user.email, config.allowedEmails)
    ) {
      await supabase.auth.signOut();
      loginUrl.searchParams.set("error", "domain");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Magic-link callback failed", error);
    loginUrl.searchParams.set("error", "callback");
    return NextResponse.redirect(loginUrl);
  }
}
