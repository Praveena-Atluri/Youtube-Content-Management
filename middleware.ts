import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const dashboardPassword = process.env.DASHBOARD_BASIC_PASSWORD;
  if (!dashboardPassword) {
    return new NextResponse("Dashboard authentication is not configured.", {
      status: 503
    });
  }

  const dashboardUser = process.env.DASHBOARD_BASIC_USER ?? "management";
  const authorization = request.headers.get("authorization");

  if (isValidBasicAuth(authorization, dashboardUser, dashboardPassword)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="YouTube Performance Dashboard"'
    }
  });
}

export const config = {
  matcher: ["/youtube-performance/:path*", "/api/youtube/:path*"]
};

function isValidBasicAuth(authorization: string | null, expectedUser: string, expectedPassword: string) {
  if (!authorization?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return user === expectedUser && password === expectedPassword;
  } catch {
    return false;
  }
}
