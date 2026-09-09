"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import {
  PHONE_COUNTRIES,
  composeInternationalPhone,
  defaultPhoneIso,
  parseInternationalPhone,
  phoneCountryByIso,
} from "@/lib/phone";

type Props = {
  locale: Locale;
  value: string;
  onChange: (combined: string) => void;
  inputClassName: string;
  required?: boolean;
  disabled?: boolean;
  prefixLabel: string;
  placeholder?: string;
  id?: string;
};

export function PhoneWithPrefix({
  locale,
  value,
  onChange,
  inputClassName,
  required,
  disabled,
  prefixLabel,
  placeholder,
  id,
}: Props) {
  const initial = parseInternationalPhone(value);
  const [iso, setIso] = useState(initial?.iso || defaultPhoneIso(locale));
  const [national, setNational] = useState(initial?.national || "");

  useEffect(() => {
    if (national.trim()) return;
    setIso(defaultPhoneIso(locale));
  }, [locale]);

  function emit(nextIso: string, nextNational: string) {
    const country = phoneCountryByIso(nextIso);
    onChange(composeInternationalPhone(country?.dial || "", nextNational));
  }

  const countries = useMemo(() => {
    const preferred = defaultPhoneIso(locale);
    return [...PHONE_COUNTRIES].sort((a, b) => {
      if (a.iso === preferred) return -1;
      if (b.iso === preferred) return 1;
      return a.names[locale].localeCompare(b.names[locale], locale);
    });
  }, [locale]);

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <select
        aria-label={prefixLabel}
        className={`${inputClassName} w-[9.75rem] shrink-0`}
        value={iso}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          const nextIso = e.target.value;
          setIso(nextIso);
          emit(nextIso, national);
        }}
      >
        {countries.map((country) => (
          <option key={country.iso} value={country.iso}>
            +{country.dial} {country.names[locale]}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={`${inputClassName} min-w-[10rem] flex-1`}
        value={national}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d\s()-]/g, "");
          setNational(next);
          emit(iso, next);
        }}
      />
    </div>
  );
}
