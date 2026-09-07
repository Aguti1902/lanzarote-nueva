import { NextResponse } from "next/server";

/** Cookie httpOnly de sesión del panel admin. */
export const ADMIN_SESSION_COOKIE = "lt_admin_session";

/** Duración de sesión: 12 horas. */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 12;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

type AttemptState = { count: number; resetAt: number };
const loginAttempts = new Map<string, AttemptState>();

function encoder() {
  return new TextEncoder();
}

function toBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return diff === 0;
}

/** Secreto de firma de sesión (preferir ADMIN_SESSION_SECRET). */
export function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder().encode(message));
  return toBase64Url(sig);
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = getAdminSessionSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD / ADMIN_SESSION_SECRET no configurado");
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000;
  const payload = `v1.${exp}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const secret = getAdminSessionSecret();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== "v1" || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${ver}.${expStr}`;
  const expected = await hmacSign(secret, payload);
  return timingSafeEqualStr(sig, expected);
}

export function adminCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE_SEC) {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Verifica cookie de sesión en un Request (Edge o Node). */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  if (!match) return false;
  const raw = match.slice(ADMIN_SESSION_COOKIE.length + 1);
  const token = decodeURIComponent(raw);
  return verifyAdminSessionToken(token);
}

/** 401 si no hay sesión admin válida. */
export async function requireAdmin(
  request: Request
): Promise<NextResponse | null> {
  if (await isAdminRequest(request)) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkLoginRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const state = loginAttempts.get(ip);
  if (!state || now > state.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    return { ok: true };
  }
  if (state.count >= LOGIN_MAX_ATTEMPTS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((state.resetAt - now) / 1000),
    };
  }
  return { ok: true };
}

export function recordLoginFailure(ip: string) {
  const now = Date.now();
  const state = loginAttempts.get(ip);
  if (!state || now > state.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  state.count += 1;
}

export function clearLoginFailures(ip: string) {
  loginAttempts.delete(ip);
}

export function passwordsMatch(input: string, expected: string): boolean {
  if (!expected) return false;
  return timingSafeEqualStr(input, expected);
}

/** Autoriza cron de Vercel (Bearer CRON_SECRET) o sesión admin. */
export async function requireCronOrAdmin(
  request: Request
): Promise<NextResponse | null> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") || "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return null;
  // Vercel Cron envía a veces este header
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron && cronSecret) {
    // Si hay CRON_SECRET, exigir Bearer; sin Bearer con solo header no basta
  }
  return requireAdmin(request);
}

export function unauthorizedCron(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

/** Verifica CRON_SECRET estricto para jobs programados. */
export function requireCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization") || "";
  if (auth === `Bearer ${cronSecret}`) return null;
  // Vercel Cron inyecta Authorization automáticamente si CRON_SECRET está en el proyecto
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "1" && process.env.VERCEL === "1") {
    // En Vercel, los crons llevan Authorization: Bearer <CRON_SECRET> si está definido.
    // Si llega x-vercel-cron sin Bearer válido, rechazar igual.
  }
  return unauthorizedCron();
}

/** Utilidad exportada por si hace falta decodificar (tests). */
export function _debugFromBase64Url(s: string) {
  return fromBase64Url(s);
}
