// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  GraduationCap,
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
  ChevronRight,
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

interface SidebarProps {
  session: Session;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
}

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Students", href: "/dashboard/students", icon: GraduationCap },
      { label: "Teachers", href: "/dashboard/teachers", icon: Users },
      { label: "Classes", href: "/dashboard/classes", icon: BookOpen },
      { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
      { label: "Grades", href: "/dashboard/grades", icon: School },
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
      { label: "Events", href: "/dashboard/events", icon: Calendar },
      { label: "Announcements", href: "/dashboard/announcements", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
    ],
  },
];

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const userRole = (session.user as any)?.role ?? "";
  const userInitials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden lg:flex w-[220px] xl:w-[240px] flex-col border-r border-border bg-card flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 h-14 px-4 border-b border-border">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-sm tracking-tight truncate">
            ScholasticOS
          </span>
          <Badge variant="outline" className="ml-auto text-[10px] font-mono py-0">
            2.0
          </Badge>
        </div>

        {/* Institution badge */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
            <div className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
              <School className="h-3 w-3 text-accent" />
            </div>
            <span className="text-xs font-medium truncate text-foreground/80">
              {(session.user as any)?.institutionName ?? "Institution"}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) =>
                !item.roles || item.roles.includes(userRole)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label}>
                <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isActive(item.href)
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto font-mono text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {isActive(item.href) && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors group">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarImage src={session.user.image ?? ""} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
