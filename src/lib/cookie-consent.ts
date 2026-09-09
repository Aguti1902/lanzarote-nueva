export const COOKIE_CONSENT_KEY = "lt_cookie_consent";
export const COOKIE_CONSENT_EVENT = "lt-cookie-consent";
export const COOKIE_SETTINGS_EVENT = "lt-cookie-settings";
export const COOKIE_CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 180;

export type CookieConsent = {
  v: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: string;
};

export const NECESSARY_ONLY_CONSENT: Omit<CookieConsent, "ts"> = {
  v: 1,
  necessary: true,
  analytics: false,
  marketing: false,
};

export function allCookieConsent(): CookieConsent {
  return {
    v: 1,
    necessary: true,
    analytics: true,
    marketing: true,
    ts: new Date().toISOString(),
  };
}

export function necessaryCookieConsent(): CookieConsent {
  return {
    ...NECESSARY_ONLY_CONSENT,
    ts: new Date().toISOString(),
  };
}

export function parseCookieConsent(raw?: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<CookieConsent>;
    if (data?.v !== 1) return null;
    return {
      v: 1,
      necessary: true,
      analytics: Boolean(data.analytics),
      marketing: Boolean(data.marketing),
      ts: typeof data.ts === "string" ? data.ts : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const fromCookie = parseCookieConsent(readBrowserCookie(COOKIE_CONSENT_KEY));
  if (fromCookie) return fromCookie;
  try {
    return parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent) {
  if (typeof document === "undefined") return;
  const payload = JSON.stringify(consent);
  document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(payload)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SEC}; SameSite=Lax`;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, payload);
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}

export function clearAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie.split("; ").map((p) => p.split("=")[0]);
  for (const name of names) {
    if (!name) continue;
    if (/^(_ga|_gid|_gat|__utm)/.test(name)) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
}
