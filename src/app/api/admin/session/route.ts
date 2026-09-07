import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  checkLoginRateLimit,
  clearLoginFailures,
  clientIp,
  createAdminSessionToken,
  getAdminPassword,
  passwordsMatch,
  recordLoginFailure,
  requireAdmin,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET: ¿hay sesión admin válida? */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const token = match
    ? decodeURIComponent(match.slice(ADMIN_SESSION_COOKIE.length + 1))
    : null;
  const ok = await verifyAdminSessionToken(token);
  return NextResponse.json({ authenticated: ok });
}

/** POST: login con contraseña → cookie httpOnly. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = checkLoginRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "Demasiados intentos. Espere unos minutos.",
        retryAfterSec: limit.retryAfterSec,
      },
      {
        status: 429,
        headers: limit.retryAfterSec
          ? { "Retry-After": String(limit.retryAfterSec) }
          : undefined,
      }
    );
  }

  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no configurada en el servidor" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const password = String(body.password || "");
  if (!passwordsMatch(password, expected)) {
    recordLoginFailure(ip);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  clearLoginFailures(ip);
  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
  return res;
}

/** DELETE: logout. */
export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  // Permitir logout aunque la sesión esté caducada
  void denied;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", adminCookieOptions(0));
  return res;
}
