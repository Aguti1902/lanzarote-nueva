"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const parts = pathname.split("/");
    // /es/excursiones -> replace first segment
    if (parts[1] && locales.includes(parts[1] as Locale)) {
      parts[1] = next;
    } else {
      parts.splice(1, 0, next);
    }
    const target = parts.join("/") || `/${next}`;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    router.push(target);
    router.refresh();
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => switchTo(e.target.value as Locale)}
        className="cursor-pointer appearance-none rounded-full border border-white/20 bg-white/10 py-1.5 pr-7 pl-3 text-xs font-bold text-white outline-none hover:bg-white/15"
        aria-label="Language"
      >
        {locales.map((code) => (
          <option key={code} value={code} className="text-ink">
            {localeLabels[code]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-white/70">
        ▾
      </span>
    </label>
  );
}
