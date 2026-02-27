"use client";

import { Bell } from "lucide-react";
import type { Session } from "next-auth";

export function TopBar({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
      <div>
        <p className="text-xs text-muted-foreground">Institution</p>
        <p className="text-sm font-semibold">{(session.user as { institutionName?: string }).institutionName ?? "scholaOps"}</p>
      </div>
      <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
