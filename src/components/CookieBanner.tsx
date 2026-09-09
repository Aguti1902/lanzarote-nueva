"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import {
  allCookieConsent,
  clearAnalyticsCookies,
  COOKIE_SETTINGS_EVENT,
  necessaryCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";
import { LEGAL_PATHS } from "@/lib/legal";

export function CookieBanner() {
  const pathname = usePathname();
  const { dict, href } = useLocale();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [configure, setConfigure] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const existing = readCookieConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      setOpen(false);
    } else {
      setOpen(true);
    }
    setReady(true);

    function onSettings() {
      const current = readCookieConsent();
      setAnalytics(Boolean(current?.analytics));
      setMarketing(Boolean(current?.marketing));
      setConfigure(true);
      setOpen(true);
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onSettings);
  }, [pathname]);

  if (!ready || !open || pathname.startsWith("/admin")) return null;

  function persist(next: CookieConsent) {
    writeCookieConsent(next);
    if (!next.analytics) clearAnalyticsCookies();
    setOpen(false);
    setConfigure(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] p-3 md:p-5"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
    >
      <div className="mx-auto max-w-4xl rounded-2xl bg-bg-deep p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10 md:p-5">
        <p
          id="cookie-banner-title"
          className="font-display text-lg font-bold"
        >
          {dict.cookies.title}
        </p>
        <p
          id="cookie-banner-body"
          className="mt-2 text-sm leading-relaxed text-white/75"
        >
          {dict.cookies.body}{" "}
          <Link
            href={href(LEGAL_PATHS.cookies)}
            className="font-semibold text-ocean underline-offset-2 hover:underline"
          >
            {dict.cookies.moreInfo}
          </Link>
        </p>

        {configure && (
          <div className="mt-4 space-y-3 rounded-xl bg-white/5 p-3 text-sm">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked disabled className="mt-1" />
              <span>
                <span className="font-bold">{dict.cookies.necessary}</span>
                <span className="mt-0.5 block text-white/60">
                  {dict.cookies.necessaryHelp}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 accent-[#eb4823]"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <span className="font-bold">{dict.cookies.analytics}</span>
                <span className="mt-0.5 block text-white/60">
                  {dict.cookies.analyticsHelp}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 accent-[#eb4823]"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span>
                <span className="font-bold">{dict.cookies.marketing}</span>
                <span className="mt-0.5 block text-white/60">
                  {dict.cookies.marketingHelp}
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            className="rounded-full bg-ocean px-5 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep"
            onClick={() => persist(allCookieConsent())}
          >
            {dict.cookies.acceptAll}
          </button>
          <button
            type="button"
            className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            onClick={() => persist(necessaryCookieConsent())}
          >
            {dict.cookies.reject}
          </button>
          {configure ? (
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white/80 underline-offset-2 hover:underline"
              onClick={() =>
                persist({
                  v: 1,
                  necessary: true,
                  analytics,
                  marketing,
                  ts: new Date().toISOString(),
                })
              }
            >
              {dict.cookies.save}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white/80 underline-offset-2 hover:underline"
              onClick={() => setConfigure(true)}
            >
              {dict.cookies.configure}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
