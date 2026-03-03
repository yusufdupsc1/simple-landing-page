"use client";

import { Bell, Menu } from "lucide-react";
import type { Session } from "next-auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useGovtPrimaryT, useT } from "@/lib/i18n/client";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sidebar } from "./sidebar";

export function TopBar({ session }: { session: Session }) {
  const { t } = useT();
  const { t: tg } = useGovtPrimaryT();
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const role = (session.user as { role?: string } | undefined)?.role;
  const [open, setOpen] = useState(false);

  const topLabel = govtPrimaryMode
    ? role === "PRINCIPAL"
      ? tg("head_teacher")
      : role === "TEACHER"
        ? tg("assistant_teacher")
        : t("school_name")
    : t("institution");

  return (
    <header className="safe-top sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="lg:hidden rounded-lg border border-border/50 p-2 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Open menu"
              id="hamburger-menu-trigger"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent
            className="fixed inset-y-0 left-0 h-full w-[280px] p-0 animate-in slide-in-from-left duration-200 border-r border-border sm:max-w-none"
            onPointerDownOutside={(e) => {
              // Prevents closing when clicking inside the sidebar links
              if (e.target instanceof Element && e.target.closest('a')) {
                setOpen(false)
              }
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Navigation Menu</DialogTitle>
            </DialogHeader>
            <div className="h-full overflow-y-auto">
              <Sidebar session={session} isMobile />
            </div>
          </DialogContent>
        </Dialog>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">{topLabel}</p>
          <p className="truncate text-sm font-semibold">
            {(session.user as { institutionName?: string }).institutionName ?? "Dhadash"}
          </p>
        </div>
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
