"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function MobileFAB() {
    return (
        <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3 lg:hidden">
            {/* Logout FAB */}
            <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-lg backdrop-blur-md transition-all active:scale-90 hover:bg-destructive hover:text-white"
                title="Sign out"
            >
                <LogOut className="h-5 w-5" />
            </button>

            {/* Settings FAB */}
            <Link
                href="/dashboard/settings"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-lg backdrop-blur-md transition-all active:scale-90 hover:bg-emerald-500 hover:text-white"
                title="Settings"
            >
                <Settings className="h-5 w-5 animate-spin-slow" />
            </Link>
        </div>
    );
}
