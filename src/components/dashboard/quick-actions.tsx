import Link from "next/link";
import { UserPlus, CalendarCheck, Megaphone, Banknote } from "lucide-react";

const actions = [
  { label: "Add Student", href: "/dashboard/students", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Take Attendance", href: "/dashboard/attendance", icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Create Announcement", href: "/dashboard/announcements", icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Record Payment", href: "/dashboard/finance", icon: Banknote, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function QuickActions() {
  return (
    <section className="group rounded-3xl border border-border/50 bg-card p-6 shadow-sm hover:border-border transition-colors relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h2 className="mb-5 text-lg font-semibold tracking-tight relative z-10">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 text-center hover:bg-muted/60 hover:border-border transition-all duration-300 group/action">
              <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover/action:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
