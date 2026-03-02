import Link from "next/link";
import {
  UserPlus,
  CalendarCheck,
  Megaphone,
  Banknote,
  FileSignature,
  ShieldCheck,
  Globe,
  Building2,
} from "lucide-react";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

const actions = [
  { label: "Add Student", primaryLabel: "Add Pupil", href: "/dashboard/students", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Take Attendance", href: "/dashboard/attendance", icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Create Announcement", href: "/dashboard/announcements", icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Record Payment", href: "/dashboard/finance", icon: Banknote, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  { label: "Principal Signature", href: "/dashboard/settings?tab=academic", icon: FileSignature, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { label: "Access Requests", href: "/dashboard/settings?tab=access", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10", hideInGovtPrimary: true },
  { label: "Guest Reports", href: "/dashboard/settings?tab=academic&focus=public", icon: Globe, color: "text-violet-500", bg: "bg-violet-500/10", hideInGovtPrimary: true },
  { label: "School Branding", primaryLabel: "School Profile", href: "/dashboard/settings?tab=profile", icon: Building2, color: "text-slate-600", bg: "bg-slate-500/10" },
];

export function QuickActions() {
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const visibleActions = actions.filter((action) => !(govtPrimaryMode && action.hideInGovtPrimary));

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:border-border sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h2 className="mb-5 text-lg font-semibold tracking-tight relative z-10">Quick Actions</h2>
      <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 text-center hover:bg-muted/60 hover:border-border transition-all duration-300 group/action">
              <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover/action:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">{govtPrimaryMode ? (action.primaryLabel ?? action.label) : action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
