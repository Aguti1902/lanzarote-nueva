"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";
import { SITE_GA_MEASUREMENT_ID, safeGaMeasurementId } from "@/lib/ga-id";

const ENV_GA_ID = safeGaMeasurementId(process.env.NEXT_PUBLIC_GA_ID || "");

export function CookieScripts() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [gaId, setGaId] = useState(ENV_GA_ID || SITE_GA_MEASUREMENT_ID);

  useEffect(() => {
    setConsent(readCookieConsent());
    function onChange(event: Event) {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      setConsent(detail || readCookieConsent());
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (ENV_GA_ID || !consent?.analytics) return;
    let cancel = false;
    fetch("/api/seo/config")
      .then((response) => response.json())
      .then((data: { measurementId?: string }) => {
        if (cancel) return;
        setGaId(safeGaMeasurementId(String(data.measurementId || "")) || SITE_GA_MEASUREMENT_ID);
      })
      .catch(() => {
        if (!cancel) setGaId(SITE_GA_MEASUREMENT_ID);
      });
    return () => {
      cancel = true;
    };
  }, [consent?.analytics]);

  if (!consent?.analytics || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-consent" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
