import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kargo-b2b-super-secret-jwt-key-2026"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /admin routes
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const token = request.cookies.get("kargo_admin_session")?.value;

    let isValid = false;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload && payload.role === "admin") {
          isValid = true;
        }
      } catch {
        isValid = false;
      }
    }

    // If user is already logged in as admin and visits /admin/login
    if (isLoginPage) {
      if (isValid) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Protected /admin/* routes
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
