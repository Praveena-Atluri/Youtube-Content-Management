import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import {
  getAccessConfig,
  INTERNAL_ACCESS_HEADER,
  isAllowedEmail,
  isAuthenticationDisabled,
  isDevelopmentBypassEnabled,
  secretsMatch
} from "@/lib/access-policy";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);
const SYNC_PATHS = new Set(["/api/sync", "/api/sync-videos"]);

function responseWithAccess(request: NextRequest, access: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(INTERNAL_ACCESS_HEADER, access);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

function rejectRequest(
  request: NextRequest,
  status: 401 | 503,
  message: string,
  cookieSource?: NextResponse
) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: message }, { status });
    return cookieSource ? copyCookies(cookieSource, response) : response;
  }

  if (status === 503) {
    const response = new NextResponse(message, { status });
    return cookieSource ? copyCookies(cookieSource, response) : response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  const response = NextResponse.redirect(loginUrl);
  return cookieSource ? copyCookies(cookieSource, response) : response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const cleanHeaders = new Headers(request.headers);
  cleanHeaders.delete(INTERNAL_ACCESS_HEADER);

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next({ request: { headers: cleanHeaders } });
  }

  if (isDevelopmentBypassEnabled()) {
    return responseWithAccess(request, "development");
  }

  // Emergency UI bypass only. API routes continue to require a valid employee
  // session or their existing automation secret.
  if (isAuthenticationDisabled() && !pathname.startsWith("/api/")) {
    return responseWithAccess(request, "temporary-public");
  }

  const config = getAccessConfig();
  if (process.env.NODE_ENV === "production" && !config.isConfigured) {
    return rejectRequest(request, 503, "Access control is not configured.");
  }

  if (
    SYNC_PATHS.has(pathname) &&
    secretsMatch(request.headers.get("x-cron-secret"), process.env.CRON_SECRET)
  ) {
    return responseWithAccess(request, "automation");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return rejectRequest(request, 503, "Supabase authentication is not configured.");
  }

  let response = NextResponse.next({ request: { headers: cleanHeaders } });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: cleanHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const { data } = await supabase.auth.getUser();
  if (
    data.user &&
    isAllowedEmail(data.user.email, config.allowedEmails)
  ) {
    cleanHeaders.set(INTERNAL_ACCESS_HEADER, "employee");
    const authenticatedResponse = NextResponse.next({ request: { headers: cleanHeaders } });
    return copyCookies(response, authenticatedResponse);
  }

  if (data.user) {
    await supabase.auth.signOut();
  }

  return rejectRequest(request, 401, "Authentication required.", response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|app-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
