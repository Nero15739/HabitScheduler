import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/register", "/manifest.webmanifest", "/sw.js", "/icon.svg", "/apple-icon.png", "/api/health"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p) || pathname.startsWith("/api/") || pathname.startsWith("/icons/")) {
    return NextResponse.next();
  }
  const hasSession = request.cookies.has("hs_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
