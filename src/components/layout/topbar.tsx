"use client";

import { Bell } from "lucide-react";
import type { Session } from "next-auth";

export function TopBar({ session }: { session: Session }) {
  return (
    <header className="safe-top sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Institution</p>
        <p className="truncate text-sm font-semibold">
          {(session.user as { institutionName?: string }).institutionName ?? "scholaOps"}
        </p>
      </div>
      <button
        className="rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
