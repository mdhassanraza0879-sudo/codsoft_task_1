import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "sms_jwt_secure_session_secret_key_32_bytes_long_minimum_2026!"
);

const COOKIE_NAME = "sms_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let user: { role?: string; status?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as { role?: string; status?: string };
    } catch {
      // Invalid/expired token
      user = null;
    }
  }

  // Allow root (/) and /login to always display the login screen directly
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  // Protected Role routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute = pathname.startsWith("/student");

  if (isAdminRoute || isTeacherRoute || isStudentRoute) {
    if (!user || user.status !== "ACTIVE") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute && user.role !== "ADMIN") {
      // Redirect to authorized portal
      if (user.role === "TEACHER") return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }

    if (isTeacherRoute && user.role !== "TEACHER") {
      if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }

    if (isStudentRoute && user.role !== "STUDENT") {
      if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
