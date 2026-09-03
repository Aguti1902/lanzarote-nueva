"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { localeLabels, type Locale } from "@/i18n/config";
import { BrandLoadingPanel } from "@/components/BrandLoadingPanel";

type LanguageLoading = {
  to: Locale;
  from?: Locale;
};

type AppLoadingContextValue = {
  startLanguageSwitch: (to: Locale, from?: Locale) => void;
  startNavigation: (href?: string) => void;
  stopLoading: () => void;
};

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null);

const languageCopy: Record<Locale, { switching: string; to: string }> = {
  es: { switching: "Cambiando el idioma", to: "a Español" },
  en: { switching: "Switching language", to: "to English" },
  de: { switching: "Sprache wird gewechselt", to: "zu Deutsch" },
};

const navCopyByPathLocale: Record<string, string> = {
  es: "Cargando página…",
  en: "Loading page…",
  de: "Seite wird geladen…",
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
  const prevPathRef = useRef(pathname);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearHideTimer();
    setLanguage(null);
    setNavPending(false);
  }, [clearHideTimer]);

  const startLanguageSwitch = useCallback(
    (to: Locale, from?: Locale) => {
      clearHideTimer();
      setNavPending(false);
      setLanguage({ to, from });
    },
    [clearHideTimer]
  );

  const startNavigation = useCallback(() => {
    if (language) return;
    clearHideTimer();
    setNavPending(true);
  }, [language, clearHideTimer]);

  useEffect(() => {
    const pathChanged = prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    if (language) {
      if (localeFromPath(pathname) === language.to) {
        clearHideTimer();
        hideTimer.current = setTimeout(() => setLanguage(null), 160);
      }
      return;
    }

    if (navPending && pathChanged) {
      clearHideTimer();
      // Deja ver el overlay un instante; loading.tsx cubre si el RSC sigue pendiente
      hideTimer.current = setTimeout(() => setNavPending(false), 180);
    }
  }, [pathname, language, navPending, clearHideTimer]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const hrefAttr = anchor.getAttribute("href");
      if (
        !hrefAttr ||
        hrefAttr.startsWith("#") ||
        hrefAttr.startsWith("mailto:") ||
        hrefAttr.startsWith("tel:")
      ) {
        return;
      }
      try {
        const url = new URL(hrefAttr, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
        if (localeFromPath(url.pathname) !== localeFromPath(window.location.pathname)) {
          return;
        }
        startNavigation();
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startNavigation]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

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

      {navPending && !language && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-ocean/15"
          aria-hidden
        >
          <div className="nav-progress-bar h-full w-1/3 bg-ocean" />
        </div>
      )}

      {language && langText ? (
        <BrandLoadingPanel
          variant="overlay"
          title={langText.switching}
          subtitle={`${langText.to} · ${localeLabels[language.to]}`}
        />
      ) : null}

      {navPending && !language ? (
        <BrandLoadingPanel
          variant="overlay"
          title={navCopyByPathLocale[pathLocale] || navCopyByPathLocale.es}
        />
      ) : null}
    </AppLoadingContext.Provider>
  );
}
