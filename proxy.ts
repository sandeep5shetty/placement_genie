import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

const publicPaths = new Set(["/", "/login", "/register"]);
const placementCellPrefix = "/placement-cell";
const placementCellLogin = "/placement-cell/login";

function isPlacementCellPath(pathname: string) {
  return (
    pathname === placementCellPrefix ||
    pathname.startsWith(`${placementCellPrefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const userType = token?.type as string | undefined;
  const isPlacementCell = userType === "placement_cell";

  if (pathname === placementCellLogin) {
    if (isPlacementCell) {
      return NextResponse.redirect(
        new URL(`${base}${placementCellPrefix}`, request.url)
      );
    }

    return NextResponse.next();
  }

  if (isPlacementCellPath(pathname)) {
    if (!isPlacementCell) {
      return NextResponse.redirect(
        new URL(`${base}${placementCellLogin}`, request.url)
      );
    }

    return NextResponse.next();
  }

  if (!token) {
    if (publicPaths.has(pathname)) {
      return NextResponse.next();
    }

    const redirectUrl = encodeURIComponent(new URL(request.url).pathname);

    return NextResponse.redirect(
      new URL(`${base}/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  if (isPlacementCell) {
    if (pathname === "/") {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(`${base}${placementCellPrefix}`, request.url)
    );
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL(`${base}/chat`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/placement-cell",
    "/placement-cell/:path*",

    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
