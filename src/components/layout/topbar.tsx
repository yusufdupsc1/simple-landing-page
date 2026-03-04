"use client";

import { Bell, Menu } from "lucide-react";
import type { Session } from "next-auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useGovtPrimaryT, useT } from "@/lib/i18n/client";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <header className="safe-top sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 sm:px-8 transition-premium">
      <div className="flex items-center gap-4 min-w-0">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition-premium hover:bg-muted hover:border-primary/30 group active:scale-95"
              aria-label="Open menu"
              id="hamburger-menu-trigger"
            >
              <Menu className="h-5 w-5 transition-transform group-hover:rotate-12" />
            </button>
          </DialogTrigger>
          <DialogContent
            className="fixed inset-y-0 left-0 h-full w-[280px] p-0 animate-in slide-in-from-left duration-300 border-none sm:max-w-none shadow-2xl"
            onPointerDownOutside={(e) => {
              if (e.target instanceof Element && e.target.closest("a")) {
                setOpen(false);
              }
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Navigation Menu</DialogTitle>
            </DialogHeader>
            <div className="h-full bg-card/95 backdrop-blur-2xl">
              <Sidebar session={session} isMobile />
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col min-w-0">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.1em] leading-none mb-1 opacity-70">
            {topLabel}
          </p>
          <p className="truncate text-sm font-bold text-foreground/90 leading-none">
            {(session.user as { institutionName?: string }).institutionName ??
              "Dhadash"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <LanguageToggle />
        </div>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-background/40 text-muted-foreground transition-premium hover:border-primary/30 hover:bg-muted hover:text-primary group active:scale-95"
          aria-label={t("notifications")}
        >
          <Bell className="h-4.5 w-4.5 transition-transform group-hover:rotate-12" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent border-2 border-background animate-pulse" />
        </button>
      </div>
    </header>
  );
}
