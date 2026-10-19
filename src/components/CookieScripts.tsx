"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

const ENV_GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim().toUpperCase() || "";
const GA_PATTERN = /^G-[A-Z0-9]{6,12}$/;

function safeGaId(value: string): string {
  const id = value.trim().toUpperCase();
  return GA_PATTERN.test(id) ? id : "";
}

export function CookieScripts() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [gaId, setGaId] = useState(safeGaId(ENV_GA_ID));

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
    if (safeGaId(ENV_GA_ID) || !consent?.analytics) return;
    let cancel = false;
    fetch("/api/seo/config")
      .then((response) => response.json())
      .then((data: { measurementId?: string }) => {
        if (cancel) return;
        setGaId(safeGaId(String(data.measurementId || "")));
      })
      .catch(() => {
        if (!cancel) setGaId("");
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
