"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localePath } from "@/i18n/path";
import type { TransferSlugMap } from "@/i18n/transfer-paths";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  href: (path?: string) => string;
  transferSlugs?: TransferSlugMap;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  transferSlugs,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Slugs públicos de traslados (CMS) para links del cliente. */
  transferSlugs?: TransferSlugMap;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict,
      transferSlugs,
      href: (path = "/") =>
        localePath(locale, path, transferSlugs ? { transferSlugs } : undefined),
    }),
    [locale, dict, transferSlugs]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
