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
  ArrowRight
} from "lucide-react";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Take Attendance", href: "/dashboard/attendance", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Smart Insights", href: "/dashboard/analytics", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Finance Hub", href: "/dashboard/finance", icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },

  { label: "Live Connect", href: "/dashboard/messages", icon: MessagesSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Add Pupil", href: "/dashboard/students", icon: UserPlus, color: "text-cyan-600", bg: "bg-cyan-50" },
  { label: "Secure Vault", href: "/dashboard/settings?tab=access", icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50" },

  { label: "Notice Board", href: "/dashboard/announcements", icon: Megaphone, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "E-Credentials", href: "/dashboard/settings?tab=academic", icon: FileBadge, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Institution Hub", href: "/dashboard/settings?tab=profile", icon: Building2, color: "text-slate-600", bg: "bg-slate-50" },
];

export function QuickActions() {
  return (
    <section className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-xl p-5 sm:p-7 shadow-sm transition-premium hover:border-primary/20 premium-shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-lg font-black tracking-tight text-foreground/90">Quick Actions</h2>
          <div className="flex gap-1 mt-1">
            <div className="h-1 w-6 rounded-full bg-bd-green" />
            <div className="h-1 w-2 rounded-full bg-bd-red" />
          </div>
        </div>
        <Link href="/dashboard/settings" className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest leading-none">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-5 flex-1 items-center">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center gap-3 group/action"
            >
              <div className={cn(
                "h-14 w-14 sm:h-16 sm:w-16 rounded-[1.25rem] flex items-center justify-center shadow-sm border border-black/5 transition-premium relative overflow-hidden",
                action.bg, action.color,
                "hover:scale-105 hover:shadow-lg active:scale-95"
              )}>
                {/* Micro-shimmer effect on hover */}
                <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover/action:translate-x-[100%] transition-transform duration-700" />
                <Icon className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-500 group-hover/action:rotate-6" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-muted-foreground/80 group-hover/action:text-foreground transition-colors leading-tight text-center px-1">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
