// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Calendar,
  Bell,
  Settings,
  LogOut,
  School,
  BookOpen,
  Bookmark,
  FileText,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  UserRound,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGovtPrimaryT, useT } from "@/lib/i18n/client";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

interface SidebarProps {
  session: Session;
  isMobile?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
  children?: Array<{
    label: string;
    href: string;
    roles?: string[];
    exact?: boolean;
  }>;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
      },
      {
        label: "Teacher Portal",
        href: "/dashboard/portal/teacher",
        icon: UserRound,
        roles: ["TEACHER"],
      },
      {
        label: "Student Portal",
        href: "/dashboard/portal/student",
        icon: GraduationCap,
        roles: ["STUDENT"],
      },
      {
        label: "Parent Portal",
        href: "/dashboard/portal/parent",
        icon: Users,
        roles: ["PARENT"],
      },
      {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
      },
    ],
  },
  {
    label: "Academic",
    items: [
      {
        label: "Students",
        href: "/dashboard/students",
        icon: GraduationCap,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
        children: [
          {
            label: "All Students",
            href: "/dashboard/students",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
            exact: true,
          },
          {
            label: "Student Reports",
            href: "/dashboard/students/reports",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"],
          },
        ],
      },
      {
        label: "Subjects",
        href: "/dashboard/subjects",
        icon: Bookmark,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
      },
      {
        label: "Teachers",
        href: "/dashboard/teachers",
        icon: Users,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
      },
      {
        label: "Classes",
        href: "/dashboard/classes",
        icon: BookOpen,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"],
      },
      {
        label: "Attendance",
        href: "/dashboard/attendance",
        icon: ClipboardCheck,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"],
      },
      {
        label: "Grades",
        href: "/dashboard/grades",
        icon: School,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Finance",
        href: "/dashboard/finance",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
      },
      {
        label: "Events",
        href: "/dashboard/events",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"],
      },
      {
        label: "Announcements",
        href: "/dashboard/announcements",
        icon: Bell,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Governance",
        href: "/dashboard/control",
        icon: ArchiveRestore,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
        children: [
          {
            label: "Inactive Records",
            href: "/dashboard/control/inactive",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
            exact: true,
          },
          {
            label: "Access Requests",
            href: "/dashboard/settings?tab=access",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
          {
            label: "Visitor Control",
            href: "/dashboard/control/visitors",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
          {
            label: "Import Center",
            href: "/dashboard/control/imports",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
        ],
      },
      {
        label: "Institution",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
        children: [
          {
            label: "Profile & Logo",
            href: "/dashboard/settings?tab=profile",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
          {
            label: "Academic & Signatures",
            href: "/dashboard/settings?tab=academic&focus=signatures",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
          {
            label: "Fee Categories",
            href: "/dashboard/settings?tab=fees",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
          {
            label: "Guest Public Reports",
            href: "/dashboard/settings?tab=academic&focus=public",
            roles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"],
          },
        ],
      },
    ],
  },
];

const GOVT_PRIMARY_HIDDEN_NAV_HREFS = new Set<string>([
  "/dashboard/analytics",
  "/dashboard/control",
  "/dashboard/control/inactive",
  "/dashboard/control/visitors",
  "/dashboard/control/imports",
  "/dashboard/settings?tab=access",
  "/dashboard/settings?tab=academic&focus=public",
]);

export function Sidebar({ session, isMobile }: SidebarProps) {
  const { t } = useT();
  const { t: tg } = useGovtPrimaryT();
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userRole = (session.user as any)?.role ?? "";
  const userInitials =
    (session.user.name ?? "User")
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const isActive = (href: string, exact = false) => {
    if (href.includes("?")) {
      const [pathOnly, rawQuery] = href.split("?", 2);
      if (!pathOnly || pathname !== pathOnly) return false;
      const queryParams = new URLSearchParams(rawQuery ?? "");
      for (const [key, value] of queryParams.entries()) {
        if (searchParams.get(key) !== value) {
          return false;
        }
      }
      return true;
    }
    if (href === "/dashboard") return pathname === "/dashboard";
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const groupedExpanded = (() => {
    const next = { ...expandedGroups };
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        const hasActiveChild = item.children.some((child) =>
          isActive(child.href, child.exact),
        );
        const key = item.href;
        if (typeof next[key] === "undefined") {
          next[key] = hasActiveChild || isActive(item.href);
        }
      }
    }
    return next;
  })();

  const sectionLabelMap: Record<string, string> = {
    Overview: "overview",
    Academic: "academic",
    Administration: "administration",
    System: "system",
  };

  const itemLabelMap: Record<string, string> = {
    Dashboard: "dashboard",
    "Teacher Portal": "teacher_portal",
    "Student Portal": "student_portal",
    "Parent Portal": "parent_portal",
    Analytics: "analytics",
    Students: "student",
    "All Students": "student",
    "Student Reports": "reports",
    Teachers: "assistant_teacher",
    Attendance: "attendance",
    Finance: "fees",
    Events: "routine",
    Grades: "result",
    Governance: "governance",
    Institution: "school_name",
    Classes: "classes",
    Subjects: "subjects",
    Announcements: "notice",
    Class: "class",
  };

  const localizeSection = (label: string) => {
    const key = sectionLabelMap[label];
    return key ? t(key) : label;
  };

  const localizeItem = (label: string) => {
    if (govtPrimaryMode && label === "Teacher Portal")
      return t("assistant_teacher_portal");
    if (govtPrimaryMode && label === "Institution")
      return t("primary_school_setup");
    if (govtPrimaryMode && label === "Students") return t("student");
    if (govtPrimaryMode && label === "Teachers") return tg("assistant_teacher");
    if (govtPrimaryMode && label === "Classes") return t("primary_classes");
    if (govtPrimaryMode && label === "Events") return tg("routine");
    if (govtPrimaryMode && label === "Announcements") return tg("notice_board");
    if (govtPrimaryMode && label === "Grades") return tg("result_sheet");
    const key = itemLabelMap[label];
    return key ? t(key) : label;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-svh w-[230px] flex-shrink-0 flex-col border-r border-border/40 bg-card/60 backdrop-blur-xl xl:w-[250px] transition-premium",
          isMobile ? "flex w-full" : "hidden lg:flex",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 h-14 px-5 border-b border-border/40">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_2px_10px_-3px_rgba(var(--primary),0.5)]">
            <ShieldCheck className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              Dhadash
            </span>
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase opacity-70">
              Ops Center
            </span>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-[9px] font-mono py-0 px-1 bg-muted/30 border-border/50 text-muted-foreground"
          >
            v1.0
          </Badge>
        </div>

        {/* Institution badge */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 transition-premium hover:bg-primary/10 cursor-default group">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
              <School className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-1">
                Institution
              </span>
              <span className="text-xs font-bold truncate text-foreground/90 leading-none">
                {(session.user as any)?.institutionName ??
                  (govtPrimaryMode ? t("school_name") : t("institution"))}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Primary"
          className="flex-1 overflow-y-auto py-1 px-3 space-y-6 custom-scrollbar"
        >
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) =>
                (!item.roles || item.roles.includes(userRole)) &&
                !(
                  govtPrimaryMode &&
                  GOVT_PRIMARY_HIDDEN_NAV_HREFS.has(item.href)
                ),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="space-y-1.5 staggered-item">
                <p className="px-3 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
                  {localizeSection(section.label)}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const hasChildren = Boolean(item.children?.length);
                    const visibleChildren = (item.children ?? []).filter(
                      (child) =>
                        (!child.roles || child.roles.includes(userRole)) &&
                        !(
                          govtPrimaryMode &&
                          GOVT_PRIMARY_HIDDEN_NAV_HREFS.has(child.href)
                        ),
                    );
                    const hasActiveChild = visibleChildren.some((child) =>
                      isActive(child.href, child.exact),
                    );
                    const active = isActive(item.href) || hasActiveChild;

                    if (!hasChildren || visibleChildren.length === 0) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-premium",
                            active
                              ? "sidebar-active-item"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-110",
                              active
                                ? "sidebar-active-icon"
                                : "text-muted-foreground/70 group-hover:text-foreground",
                            )}
                          />
                          <span className="truncate">
                            {localizeItem(item.label)}
                          </span>
                          {item.badge && (
                            <span className="ml-auto font-mono text-[9px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    }

                    const expanded = groupedExpanded[item.href];

                    return (
                      <div key={item.href} className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGroups((prev) => ({
                              ...prev,
                              [item.href]: !expanded,
                            }))
                          }
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-premium",
                            active
                              ? "sidebar-active-item"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-110",
                              active
                                ? "sidebar-active-icon"
                                : "text-muted-foreground/70 group-hover:text-foreground",
                            )}
                          />
                          <span className="truncate">
                            {localizeItem(item.label)}
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-3.5 w-3.5 transition-transform duration-300",
                              expanded ? "rotate-180" : "rotate-0 opacity-40",
                            )}
                          />
                        </button>

                        {expanded ? (
                          <div className="space-y-1 pl-10.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {visibleChildren.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                prefetch={false}
                                className={cn(
                                  "flex items-center rounded-lg px-2 py-1.5 text-[13px] font-medium transition-premium relative",
                                  isActive(child.href, child.exact)
                                    ? "text-primary bg-primary/5 font-bold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                                )}
                              >
                                {isActive(child.href, child.exact) && (
                                  <span className="absolute left-[-8px] w-1 h-1 rounded-full bg-primary" />
                                )}
                                {localizeItem(child.label)}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="mt-auto relative overflow-hidden">
          {/* Subtle Monument Motif Background */}
          <div className="absolute right-[-20px] bottom-[-20px] h-32 w-32 monument-motif bg-primary/5 rotate-12 pointer-events-none" />

          <div className="p-4 border-t border-border/40 bg-muted/20 backdrop-blur-md">
            <div className="mb-3 px-2">
              <p className="text-[10px] font-bn text-primary/60 italic leading-tight text-center">
                &quot;আমার সোনার বাংলা, আমি তোমায় ভালোবাসি&quot;
              </p>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-background/80 transition-premium border border-transparent hover:border-border/50 hover:shadow-sm group">
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-background ring-offset-1 ring-offset-border/40 transition-transform group-hover:scale-105">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-none mb-1 text-foreground/90">
                  {session.user.name ?? "User"}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium truncate leading-none uppercase tracking-wide opacity-70">
                  {userRole.replace("_", " ")}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-premium"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
