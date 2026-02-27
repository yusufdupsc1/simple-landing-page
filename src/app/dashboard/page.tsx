// src/app/dashboard/page.tsx
// Dashboard Overview — React 19 Server Component

import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/server/actions/students";
import { db } from "@/lib/db";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from "@/lib/utils";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Next.js 15/16 — no caching by default for dynamic data
export const dynamic = "force-dynamic";

async function getAttendanceData(institutionId: string) {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const data = await db.attendance.groupBy({
      by: ["date", "status"],
      where: {
        institutionId,
        date: { gte: last30Days },
      },
      _count: true,
      orderBy: { date: "asc" },
    });

    // Prisma groupBy returns `_count` as an object (`{ _all: number }`).
    // Normalize to a plain number to avoid rendering object values in React.
    return data.map(
      (row: { date: Date; status: string; _count?: number | { _all?: number } }) => ({
        date: row.date,
        status: row.status,
        _count:
          typeof row._count === "number"
            ? row._count
            : Number(row._count?._all ?? 0),
      }),
    );
  } catch (error) {
    console.error("[DASHBOARD_ATTENDANCE]", error);
    return [];
  }
}

async function getRevenueData(institutionId: string) {
  try {
    const year = new Date().getFullYear();
    const data = await db.payment.groupBy({
      by: ["paidAt"],
      where: {
        institutionId,
        paidAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      _sum: { amount: true },
    });
    return data;
  } catch (error) {
    console.error("[DASHBOARD_REVENUE]", error);
    return [];
  }
}

async function getUpcomingEvents(institutionId: string) {
  try {
    return await db.event.findMany({
      where: {
        institutionId,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });
  } catch (error) {
    console.error("[DASHBOARD_EVENTS]", error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as {
    institutionId?: string;
    institutionName?: string;
    name?: string | null;
  } | undefined;
  if (!user?.institutionId) {
    return null;
  }

  const institutionId = user.institutionId;
  const institutionName = user.institutionName ?? "your institution";
  const userName = user.name?.split(" ")[0] ?? "there";
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: DEFAULT_TIMEZONE,
    }).format(now),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statsResult = await safeLoader(
    "DASHBOARD_STATS",
    () => getDashboardStats(),
    null,
    { institutionId },
  );
  const attendanceData = await safeLoader(
    "DASHBOARD_ATTENDANCE",
    () => getAttendanceData(institutionId),
    [],
    { institutionId },
  );
  const revenueData = await safeLoader(
    "DASHBOARD_REVENUE",
    () => getRevenueData(institutionId),
    [],
    { institutionId },
  );
  const events = await safeLoader(
    "DASHBOARD_EVENTS",
    () => getUpcomingEvents(institutionId),
    [],
    { institutionId },
  );

  const stats = statsResult ?? {
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    pendingFees: { amount: 0, count: 0 },
    recentStudents: [],
  };

  return (
    <div className="space-y-6 animate-fade-in sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {now.toLocaleDateString(DEFAULT_LOCALE, {
            timeZone: DEFAULT_TIMEZONE,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting},{" "}
          <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at{" "}
          <strong>{institutionName}</strong> today.
        </p>
      </div>

      {/* KPI Stats */}
      <StatsGrid stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart data={attendanceData} />
        </div>
        <div>
          <RevenueChart data={revenueData} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentStudents students={stats.recentStudents} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}
