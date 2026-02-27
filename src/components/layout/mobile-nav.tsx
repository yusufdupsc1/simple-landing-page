"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Users, Calendar } from "lucide-react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: GraduationCap },
  { href: "/dashboard/teachers", label: "Teachers", icon: Users },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
];

export function MobileNav({ session: _session }: { session: Session }) {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 border-t border-border/80 bg-background/90 shadow-[0_-8px_30px_hsl(var(--foreground)/0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              "mx-1 my-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
