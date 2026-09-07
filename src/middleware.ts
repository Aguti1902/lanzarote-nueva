import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import {
  canonicalLocalizedPathname,
  rewriteToInternalPathname,
} from "@/i18n/path";
import { resolveLegacyRedirect } from "@/lib/legacy-redirects";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

const PUBLIC_FILE = /\.(.*)$/;

/** Rutas API admin públicas (login / sesión check). */
const ADMIN_API_PUBLIC = new Set([
  "/api/admin/session",
]);

function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language") || "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase())
    .find((code) => code && isLocale(code));

  return preferred || defaultLocale;
}

function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // —— Panel admin (páginas) ——
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      // Si ya hay sesión, ir al panel
      if (await isAdmin(request)) {
        return securityHeaders(
          NextResponse.redirect(new URL("/admin", request.url))
        );
      }
      return securityHeaders(NextResponse.next());
    }
    if (!(await isAdmin(request))) {
      return securityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }
    return securityHeaders(NextResponse.next());
  }

  // —— APIs admin (todas requieren sesión salvo login/session) ——
  if (pathname.startsWith("/api/admin")) {
    if (ADMIN_API_PUBLIC.has(pathname)) {
      return securityHeaders(NextResponse.next());
    }
    if (!(await isAdmin(request))) {
      return securityHeaders(
        NextResponse.json({ error: "No autorizado" }, { status: 401 })
      );
    }
    return securityHeaders(NextResponse.next());
  }

  // —— Cron: se autentica en la propia ruta con CRON_SECRET ——
  if (pathname.startsWith("/api/cron")) {
    return securityHeaders(NextResponse.next());
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return securityHeaders(NextResponse.next());
  }

  // URLs de la web antigua → rutas nuevas (301)
  const legacyTarget = resolveLegacyRedirect(pathname);
  if (legacyTarget && legacyTarget !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return securityHeaders(NextResponse.redirect(url, 301));
  }

  const segment = pathname.split("/")[1];
  if (segment && isLocale(segment)) {
    const canonical = canonicalLocalizedPathname(pathname);
    if (canonical && canonical !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = canonical;
      return securityHeaders(NextResponse.redirect(url, 301));
    }

    const rewriteTarget = rewriteToInternalPathname(pathname);
    if (rewriteTarget && rewriteTarget !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = rewriteTarget;
      return securityHeaders(NextResponse.rewrite(url));
    }

    return securityHeaders(NextResponse.next());
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
  return securityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};

void locales;
