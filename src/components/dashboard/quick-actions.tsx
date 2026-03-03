import Link from "next/link";
import {
  UserPlus,
  CalendarCheck,
  Megaphone,
  Banknote,
  BrainCircuit,
  MessagesSquare,
  ShieldCheck,
  Building2,
  FileBadge,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Take Attendance",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "AI Performance",
    href: "/dashboard/analytics",
    icon: BrainCircuit,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Finance Hub",
    href: "/dashboard/finance",
    icon: Banknote,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Live Connect",
    href: "/dashboard/messages",
    icon: MessagesSquare,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Add Pupil",
    href: "/dashboard/students",
    icon: UserPlus,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    label: "Secure Vault",
    href: "/dashboard/settings?tab=access",
    icon: ShieldCheck,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    label: "Cloud Storage",
    href: "/dashboard/control/imports",
    icon: Building2,
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
  {
    label: "Notice Board",
    href: "/dashboard/announcements",
    icon: Megaphone,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Global Search",
    href: "/dashboard/settings?tab=profile",
    icon: FileBadge,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    label: "AI Assistant",
    href: "/dashboard/analytics",
    icon: BrainCircuit,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    label: "Identity Vault",
    href: "/dashboard/settings?tab=access",
    icon: ShieldCheck,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    label: "Bulk Upload",
    href: "/dashboard/control/imports",
    icon: UserPlus,
    color: "text-lime-600",
    bg: "bg-lime-50",
  },
];

export function QuickActions() {
  return (
    <section className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-4 sm:p-6 shadow-sm transition-premium hover:border-primary/20 premium-shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-black tracking-tight text-foreground/80 uppercase">
            Quick Actions
          </h2>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest leading-none"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 items-center">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center gap-1.5 group/action"
            >
              <div
                className={cn(
                  "h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm border border-black/5 transition-premium relative overflow-hidden",
                  action.bg,
                  action.color,
                  "hover:scale-105 hover:shadow-lg active:scale-95",
                )}
              >
                {/* Micro-shimmer effect on hover */}
                <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover/action:translate-x-[100%] transition-transform duration-700" />
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-500 group-hover/action:rotate-6" />
              </div>
              <span className="text-[9px] sm:text-[11px] font-bold tracking-tight text-muted-foreground/80 group-hover/action:text-foreground transition-colors leading-tight text-center px-0.5 line-clamp-1 w-full">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
