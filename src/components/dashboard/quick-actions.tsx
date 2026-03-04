import Link from "next/link";
import {
  UserPlus,
  CalendarCheck,
  Megaphone,
  Banknote,
  Send,
  FileBadge,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    key: "add-pupil",
    label: { bn: "শিক্ষার্থী যোগ", en: "Add Pupil" },
    href: "/dashboard/students",
    icon: UserPlus,
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    key: "take-attendance",
    label: { bn: "উপস্থিতি নিন", en: "Take Attendance" },
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "create-notice",
    label: { bn: "নোটিশ তৈরি", en: "Create Notice" },
    href: "/dashboard/announcements",
    icon: Megaphone,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "collect-fee",
    label: { bn: "ফি সংগ্রহ", en: "Collect Fee" },
    href: "/dashboard/finance",
    icon: Banknote,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    key: "add-result",
    label: { bn: "রেজাল্ট যোগ", en: "Add Result" },
    href: "/dashboard/grades",
    icon: FileBadge,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "send-sms",
    label: { bn: "এসএমএস পাঠান", en: "Send SMS" },
    href: "/dashboard/notices",
    icon: Send,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
];

interface QuickActionsProps {
  isBangla: boolean;
}

export function QuickActions({ isBangla }: QuickActionsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isBangla ? "দ্রুত কাজ" : "Quick Actions"}
        </h2>
        <Link
          href="/dashboard/notices"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {isBangla ? "সব দেখুন" : "View all"}{" "}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
        data-testid="quick-actions-grid"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              href={action.href}
              className="group/action flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-2 py-2 text-center transition hover:bg-muted/40"
              data-testid={`quick-action-${action.key}`}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 sm:h-10 sm:w-10",
                  action.bg,
                  action.color,
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[11px] font-medium leading-tight text-muted-foreground transition-colors group-hover/action:text-foreground">
                {isBangla ? action.label.bn : action.label.en}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
