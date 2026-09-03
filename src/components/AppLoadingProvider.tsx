"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { localeLabels, type Locale } from "@/i18n/config";

type LanguageLoading = {
  to: Locale;
  from?: Locale;
};

type AppLoadingContextValue = {
  startLanguageSwitch: (to: Locale, from?: Locale) => void;
  startNavigation: () => void;
  stopLoading: () => void;
};

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

const languageCopy: Record<Locale, { switching: string; to: string }> = {
  es: { switching: "Cambiando el idioma", to: "a Español" },
  en: { switching: "Switching language", to: "to English" },
  de: { switching: "Sprache wird gewechselt", to: "zu Deutsch" },
};

const navCopyByPathLocale: Record<string, string> = {
  es: "Cargando…",
  en: "Loading…",
  de: "Wird geladen…",
};

function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1];
  if (seg === "en" || seg === "de" || seg === "es") return seg;
  return "es";
}

export function useAppLoading() {
  const ctx = useContext(AppLoadingContext);
  if (!ctx) {
    throw new Error("useAppLoading must be used within AppLoadingProvider");
  }
  return ctx;
}

/** Safe hook when provider might be absent (tests). */
export function useAppLoadingOptional() {
  return useContext(AppLoadingContext);
}

export function AppLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<LanguageLoading | null>(null);
  const [navPending, setNavPending] = useState(false);
  const [showNavOverlay, setShowNavOverlay] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const clearNavTimer = useCallback(() => {
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearNavTimer();
    setLanguage(null);
    setNavPending(false);
    setShowNavOverlay(false);
  }, [clearNavTimer]);

  const startLanguageSwitch = useCallback((to: Locale, from?: Locale) => {
    setShowNavOverlay(false);
    setNavPending(false);
    setLanguage({ to, from });
  }, []);

  const startNavigation = useCallback(() => {
    if (language) return;
    setNavPending(true);
    clearNavTimer();
    // Solo overlay completo si la navegación tarda de verdad
    navTimer.current = setTimeout(() => {
      setShowNavOverlay(true);
    }, 320);
  }, [language, clearNavTimer]);

  // Al completar el cambio de ruta, ocultar loaders
  useEffect(() => {
    stopLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar pathname
  }, [pathname]);

  // Clicks en enlaces internos → feedback de carga
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) {
        return;
      }
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const next = url.pathname + url.search;
        const current = window.location.pathname + window.location.search;
        if (next === current) return;
        // Cambio de locale: LanguageSwitcher ya dispara su overlay
        const nextLoc = localeFromPath(url.pathname);
        const curLoc = localeFromPath(window.location.pathname);
        if (nextLoc !== curLoc) return;
        startTransition(() => startNavigation());
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startNavigation]);

  useEffect(() => () => clearNavTimer(), [clearNavTimer]);

  const value = useMemo(
    () => ({ startLanguageSwitch, startNavigation, stopLoading }),
    [startLanguageSwitch, startNavigation, stopLoading]
  );

  const pathLocale = localeFromPath(pathname);
  const langText = language
    ? languageCopy[language.to] || languageCopy.es
    : null;

  return (
    <AppLoadingContext.Provider value={value}>
      {children}

      {/* Barra superior inmediata en navegación lenta */}
      {navPending && !language && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-ocean/15"
          aria-hidden
        >
          <div className="nav-progress-bar h-full w-1/3 bg-ocean" />
        </div>
      )}

      {/* Overlay idioma (siempre) o navegación (solo si tarda) */}
      {(language || showNavOverlay) && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1c2433]/72 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(23,28,38,0.28)]">
            <div className="logo-loading-pulse relative h-16 w-24">
              <Image
                src="/images/brand/logo-mark.png"
                alt=""
                fill
                className="object-contain"
                sizes="96px"
                priority
              />
            </div>
            {language && langText ? (
              <>
                <p className="mt-5 text-sm font-semibold tracking-wide text-ink-muted uppercase">
                  {langText.switching}
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold text-ocean">
                  {langText.to}
                </p>
                <p className="mt-2 text-xs text-ink-muted">
                  {localeLabels[language.to]}
                </p>
              </>
            ) : (
              <p className="mt-5 text-sm font-semibold text-ink-muted">
                {navCopyByPathLocale[pathLocale] || navCopyByPathLocale.es}
              </p>
            )}
            <div className="mt-6 flex gap-1.5" aria-hidden>
              <span className="logo-loading-dot h-2 w-2 rounded-full bg-ocean" />
              <span className="logo-loading-dot logo-loading-dot-2 h-2 w-2 rounded-full bg-ocean" />
              <span className="logo-loading-dot logo-loading-dot-3 h-2 w-2 rounded-full bg-ocean" />
            </div>
          </div>
        </div>
      )}
    </AppLoadingContext.Provider>
  );
}
