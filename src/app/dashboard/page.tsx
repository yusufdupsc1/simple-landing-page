// src/app/dashboard/page.tsx
// Dashboard Overview — React 19 Server Component

import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/server/actions/students";
import { db } from "@/lib/db";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { StatsSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Next.js 15/16 — no caching by default for dynamic data
export const dynamic = "force-dynamic";

async function getAttendanceData(institutionId: string) {
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

  return data;
}

async function getRevenueData(institutionId: string) {
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
}

export default async function DashboardPage() {
  const session = await auth();
  const institutionId = session!.user.institutionId;
  const userName = session!.user.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting},{" "}
          <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at{" "}
          <strong>{session!.user.institutionName}</strong> today.
        </p>
      </div>

      {/* KPI Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection institutionId={institutionId} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <AttendanceChartSection institutionId={institutionId} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChartSection institutionId={institutionId} />
          </Suspense>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <RecentStudentsSection institutionId={institutionId} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <QuickActions />
          <Suspense fallback={<ChartSkeleton />}>
            <UpcomingEventsSection institutionId={institutionId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ── Async sub-components (parallel data fetching via Suspense) ──

async function StatsSection({ institutionId }: { institutionId: string }) {
  const stats = await getDashboardStats();
  return <StatsGrid stats={stats} />;
}

async function AttendanceChartSection({ institutionId }: { institutionId: string }) {
  const data = await getAttendanceData(institutionId);
  return <AttendanceChart data={data} />;
}

async function RevenueChartSection({ institutionId }: { institutionId: string }) {
  const data = await getRevenueData(institutionId);
  return <RevenueChart data={data} />;
}

async function RecentStudentsSection({ institutionId }: { institutionId: string }) {
  const stats = await getDashboardStats();
  return <RecentStudents students={stats.recentStudents} />;
}

async function UpcomingEventsSection({ institutionId }: { institutionId: string }) {
  const events = await db.event.findMany({
    where: {
      institutionId,
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  });
  return <UpcomingEvents events={events} />;
}
