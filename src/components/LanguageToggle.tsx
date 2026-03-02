"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";
import type { SupportedLocale } from "@/lib/i18n/getDict";

const LOCALE_COOKIE = "locale";
const LOCALE_STORAGE_KEY = "dhadash.locale";
const LOCALE_EVENT = "dhadash:locale-changed";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const [first] = parts;
  if (first === "bn" || first === "en") {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname;
}

function localeFromPathname(pathname: string): SupportedLocale | null {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first === "bn" || first === "en") return first;
  return null;
}

function persistLocale(locale: SupportedLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage can be blocked in strict browser modes.
  }
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT));
}

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preferredLocale = useLocale();

  const localeInPath = useMemo(() => localeFromPathname(pathname), [pathname]);
  const activeLocale = localeInPath ?? preferredLocale;

  const targetBasePath = useMemo(() => stripLocalePrefix(pathname), [pathname]);
  const queryString = searchParams.toString();

  function switchLocale(nextLocale: SupportedLocale) {
    if (nextLocale === activeLocale) return;
    persistLocale(nextLocale);

    const prefixedPath =
      targetBasePath === "/" ? `/${nextLocale}` : `/${nextLocale}${targetBasePath}`;
    const nextHref = queryString ? `${prefixedPath}?${queryString}` : prefixedPath;
    router.push(nextHref);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1">
      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
      <Button
        type="button"
        size="sm"
        variant={activeLocale === "bn" ? "default" : "ghost"}
        className="h-7 rounded-full px-2 text-[11px]"
        onClick={() => switchLocale("bn")}
      >
        BN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={activeLocale === "en" ? "default" : "ghost"}
        className="h-7 rounded-full px-2 text-[11px]"
        onClick={() => switchLocale("en")}
      >
        EN
      </Button>
    </div>
  );
}
