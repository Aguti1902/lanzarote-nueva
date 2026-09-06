import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import {
  canonicalLocalizedPathname,
  rewriteToInternalPathname,
} from "@/i18n/path";
import { resolveLegacyRedirect } from "@/lib/legacy-redirects";

const PUBLIC_FILE = /\.(.*)$/;

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // URLs de la web antigua → rutas nuevas (301)
  const legacyTarget = resolveLegacyRedirect(pathname);
  if (legacyTarget && legacyTarget !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 301);
  }

  const segment = pathname.split("/")[1];
  if (segment && isLocale(segment)) {
    // Slugs en español (u otro idioma) con locale en/de → URL canónica traducida
    const canonical = canonicalLocalizedPathname(pathname);
    if (canonical && canonical !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = canonical;
      return NextResponse.redirect(url, 301);
    }

    // /en/excursions → rewrite interno a /en/excursiones (carpetas App Router)
    const rewriteTarget = rewriteToInternalPathname(pathname);
    if (rewriteTarget && rewriteTarget !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = rewriteTarget;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};

void locales;
