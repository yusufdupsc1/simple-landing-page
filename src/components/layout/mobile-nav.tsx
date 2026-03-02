"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Users, Calendar, ClipboardCheck, School, Bell, ArchiveRestore } from "lucide-react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { useT } from "@/lib/i18n/client";

function getItems(role?: string) {
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const isPrivileged = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role ?? "");
  if (role === "STUDENT") {
    return [
      { href: "/dashboard/portal/student", labelKey: "student_portal", icon: LayoutDashboard },
      { href: "/dashboard/portal/student", labelKey: "fees", icon: GraduationCap },
      { href: "/dashboard/portal/student", labelKey: "result", icon: School },
      { href: "/dashboard/portal/student", labelKey: "notice", icon: Bell },
    ];
  }
  if (role === "PARENT") {
    return [
      { href: "/dashboard/portal/parent", labelKey: "parent_portal", icon: LayoutDashboard },
      { href: "/dashboard/portal/parent", labelKey: "guardian", icon: Users },
      { href: "/dashboard/portal/parent", labelKey: "fees", icon: GraduationCap },
      { href: "/dashboard/portal/parent", labelKey: "notice", icon: Bell },
    ];
  }
  if (role === "TEACHER") {
    return [
      { href: "/dashboard/portal/teacher", labelKey: "teacher_portal", icon: LayoutDashboard },
      { href: "/dashboard/attendance", labelKey: "attendance", icon: ClipboardCheck },
      { href: "/dashboard/grades", labelKey: "result", icon: School },
      { href: "/dashboard/events", labelKey: "routine", icon: Calendar },
    ];
  }

  if (isPrivileged) {
    return [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/dashboard/students", labelKey: "student", icon: GraduationCap },
      { href: "/dashboard/teachers", labelKey: "assistant_teacher", icon: Users },
      govtPrimaryMode
        ? { href: "/dashboard/classes", labelKey: "class", icon: School }
        : { href: "/dashboard/control/inactive", labelKey: "governance", icon: ArchiveRestore },
    ];
  }

  return [
    { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/students", labelKey: "student", icon: GraduationCap },
    { href: "/dashboard/teachers", labelKey: "assistant_teacher", icon: Users },
    { href: "/dashboard/events", labelKey: "routine", icon: Calendar },
  ];
}

export function MobileNav({ session }: { session: Session }) {
  const { t } = useT();
  const pathname = usePathname();
  const role = (session.user as { role?: string } | undefined)?.role;
  const items = getItems(role);

  return (
    <nav
      aria-label="Mobile primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 border-t border-border/80 bg-background/90 shadow-[0_-8px_30px_hsl(var(--foreground)/0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden"
    >
      {items.map((item) => {
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
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
