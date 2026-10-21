import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AREA_ROLE: Record<string, "ADMIN" | "TEACHER" | "STUDENT"> = {
  "/portal/admin": "ADMIN",
  "/portal/teacher": "TEACHER",
  "/portal/student": "STUDENT",
};
const HOME: Record<string, string> = { ADMIN: "/portal/admin", TEACHER: "/portal/teacher", STUDENT: "/portal/student" };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = Object.keys(AREA_ROLE).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!area) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.role) {
    const url = new URL("/portal/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  const required = AREA_ROLE[area];
  if (token.role !== required) {
    return NextResponse.redirect(new URL(HOME[token.role as string] ?? "/portal/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/admin/:path*", "/portal/teacher/:path*", "/portal/student/:path*"],
};
