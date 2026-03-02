"use client";

import { Bell } from "lucide-react";
import type { Session } from "next-auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useGovtPrimaryT, useT } from "@/lib/i18n/client";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

export function TopBar({ session }: { session: Session }) {
  const { t } = useT();
  const { t: tg } = useGovtPrimaryT();
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const role = (session.user as { role?: string } | undefined)?.role;

  const topLabel = govtPrimaryMode
    ? role === "PRINCIPAL"
      ? tg("head_teacher")
      : role === "TEACHER"
        ? tg("assistant_teacher")
        : t("school_name")
    : t("institution");

  return (
    <header className="safe-top sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{topLabel}</p>
        <p className="truncate text-sm font-semibold">
          {(session.user as { institutionName?: string }).institutionName ?? "Dhadash"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <button
          className="rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
          aria-label={t("notifications")}
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
