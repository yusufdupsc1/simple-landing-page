"use client";

import { useEffect, useMemo, useState } from "react";
import { getCommonDict, normalizeLocale, type SupportedLocale } from "@/lib/i18n/getDict";
import { tFromDict } from "@/lib/i18n/t";

const LOCALE_COOKIE = "locale";
const LOCALE_STORAGE_KEY = "dhadash.locale";
const LOCALE_EVENT = "dhadash:locale-changed";

function readLocalePreference(): SupportedLocale {
  if (typeof document === "undefined") return "bn";

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${LOCALE_COOKIE}=`));

  if (cookie) {
    const value = cookie.split("=")[1] ?? "bn";
    return normalizeLocale(decodeURIComponent(value));
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) return normalizeLocale(stored);
  } catch {
    // localStorage might be blocked by browser policy.
  }

  if (navigator.language?.toLowerCase().startsWith("bn")) return "bn";
  return "bn";
}

export function setLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === "undefined") return;
  const expiresInSeconds = 60 * 60 * 24 * 30;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${expiresInSeconds}; samesite=lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage might be blocked by browser policy.
  }
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT));
}

export function useLocale(): SupportedLocale {
  const [locale, setLocale] = useState<SupportedLocale>(() =>
    readLocalePreference(),
  );

  useEffect(() => {
    const update = () => setLocale(readLocalePreference());
    update();
    window.addEventListener(LOCALE_EVENT, update);

    return () => {
      window.removeEventListener(LOCALE_EVENT, update);
    };
  }, []);

  return locale;
}

export function useT() {
  const locale = useLocale();

  return useMemo(() => {
    const dict = getCommonDict(locale);
    const fallback = getCommonDict("en");

    return {
      locale,
      t: (key: string) => tFromDict(key, dict, fallback),
    };
  }, [locale]);
}
