import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { db } from "@/lib/db";
import { normalizeLocale } from "@/lib/i18n/getDict";
import { getDefaultDashboardPath } from "@/lib/role-routing";
import { DEFAULT_TIMEZONE } from "@/lib/utils";
import { safeLoader } from "@/lib/server/safe-loader";
import { getDashboardStats } from "@/server/actions/students";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { DashboardSearchCard } from "@/components/dashboard/dashboard-search-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { StatusOverview } from "@/components/dashboard/status-overview";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";

export const metadata: Metadata = {
  title: "Dashboard",
};

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

    return data.map(
      (row: {
        date: Date;
        status: string;
        _count?: number | { _all?: number };
      }) => ({
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
    return await db.payment.groupBy({
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

async function getDashboardOverview(institutionId: string) {
  try {
    const [studentStatusRows, teacherStatusRows, classRows] = await Promise.all([
      db.student.groupBy({
        by: ["status"],
        where: { institutionId },
        _count: { _all: true },
      }),
      db.teacher.groupBy({
        by: ["status"],
        where: { institutionId },
        _count: { _all: true },
      }),
      db.class.findMany({
        where: { institutionId, isActive: true },
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
          capacity: true,
          _count: { select: { students: true } },
        },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
        take: 20,
      }),
    ]);

    const studentCounts = {
      ACTIVE: 0,
      INACTIVE: 0,
      GRADUATED: 0,
      TRANSFERRED: 0,
    };

    for (const row of studentStatusRows) {
      const count = Number(row._count?._all ?? 0);
      if (row.status === "ACTIVE") studentCounts.ACTIVE = count;
      if (row.status === "INACTIVE") studentCounts.INACTIVE = count;
      if (row.status === "GRADUATED") studentCounts.GRADUATED = count;
      if (row.status === "TRANSFERRED") studentCounts.TRANSFERRED = count;
    }

    const teacherCounts = {
      ACTIVE: 0,
      ON_LEAVE: 0,
      INACTIVE: 0,
      RESIGNED: 0,
    };

    for (const row of teacherStatusRows) {
      const count = Number(row._count?._all ?? 0);
      if (row.status === "ACTIVE") teacherCounts.ACTIVE = count;
      if (row.status === "ON_LEAVE") teacherCounts.ON_LEAVE = count;
      if (row.status === "INACTIVE") teacherCounts.INACTIVE = count;
      if (row.status === "RESIGNED") teacherCounts.RESIGNED = count;
    }

    const classItems = classRows.map((cls) => {
      const count = Number(cls._count.students ?? 0);
      const safeCapacity = cls.capacity > 0 ? cls.capacity : 1;
      const percentage = Math.round((count / safeCapacity) * 100);
      const className = cls.name?.trim() || `Class ${cls.grade}${cls.section}`;

      return {
        id: cls.id,
        name: className,
        count,
        percentage,
      };
    });

    const spotlight = [...classItems].sort((a, b) => b.count - a.count).slice(0, 2);
    const strongest =
      [...classItems].sort((a, b) => b.percentage - a.percentage)[0] ?? null;
    const needsSupport =
      [...classItems].sort((a, b) => a.percentage - b.percentage)[0] ?? null;

    return {
      students: {
        total:
          studentCounts.ACTIVE +
          studentCounts.INACTIVE +
          studentCounts.GRADUATED +
          studentCounts.TRANSFERRED,
        active: studentCounts.ACTIVE,
        inactive: studentCounts.INACTIVE,
        graduated: studentCounts.GRADUATED,
        transferred: studentCounts.TRANSFERRED,
      },
      teachers: {
        total:
          teacherCounts.ACTIVE +
          teacherCounts.ON_LEAVE +
          teacherCounts.INACTIVE +
          teacherCounts.RESIGNED,
        active: teacherCounts.ACTIVE,
        onLeave: teacherCounts.ON_LEAVE,
        inactive: teacherCounts.INACTIVE,
        resigned: teacherCounts.RESIGNED,
      },
      classes: {
        total: classItems.length,
        spotlight,
        strongest,
        needsSupport,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD_OVERVIEW]", error);
    return {
      students: {
        total: 0,
        active: 0,
        inactive: 0,
        graduated: 0,
        transferred: 0,
      },
      teachers: {
        total: 0,
        active: 0,
        onLeave: 0,
        inactive: 0,
        resigned: 0,
      },
      classes: {
        total: 0,
        spotlight: [],
        strongest: null,
        needsSupport: null,
      },
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const user = session?.user as
    | {
        institutionId?: string;
        institutionName?: string;
        name?: string | null;
        role?: string;
      }
    | undefined;

  if (!user?.institutionId) {
    return null;
  }

  if (user.role && ["TEACHER", "STUDENT", "PARENT"].includes(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const institutionId = user.institutionId;
  const institutionName = user.institutionName ?? "Dhadash";
  const userName = user.name?.split(" ")[0] ?? "Admin";
  const cookieStore = await cookies();
  const locale = normalizeLocale(
    cookieStore.get("NEXT_LOCALE")?.value ?? cookieStore.get("locale")?.value,
  );
  const isBangla = locale === "bn";

  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: DEFAULT_TIMEZONE,
    }).format(now),
  );

  const greeting = isBangla
    ? hour < 12
      ? "শুভ সকাল"
      : hour < 17
        ? "শুভ অপরাহ্ন"
        : "শুভ সন্ধ্যা"
    : hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const formattedDate = now.toLocaleDateString(isBangla ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: DEFAULT_TIMEZONE,
  });

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

  const overview = await safeLoader(
    "DASHBOARD_OVERVIEW",
    () => getDashboardOverview(institutionId),
    {
      students: {
        total: 0,
        active: 0,
        inactive: 0,
        graduated: 0,
        transferred: 0,
      },
      teachers: {
        total: 0,
        active: 0,
        onLeave: 0,
        inactive: 0,
        resigned: 0,
      },
      classes: {
        total: 0,
        spotlight: [],
        strongest: null,
        needsSupport: null,
      },
    },
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
    <div className="space-y-4 pb-10">
      <section className="rounded-2xl border border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
          {greeting}, <span className="text-primary">{userName}</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          {isBangla
            ? `আজ ${institutionName} এ কী হচ্ছে তা দেখুন। ${govtPrimaryMode ? "Govt Primary mode সক্রিয়।" : ""}`
            : `Here's what's happening at ${institutionName} today. ${govtPrimaryMode ? "Govt Primary mode is active." : ""}`}
        </p>
      </section>

      <StatsGrid
        stats={stats}
        isBangla={isBangla}
        govtPrimaryMode={govtPrimaryMode}
      />

      <DashboardSearchCard isBangla={isBangla} />

      <StatusOverview data={overview} isBangla={isBangla} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceChart data={attendanceData} isBangla={isBangla} />
        </div>
        <div>
          <RevenueChart data={revenueData} isBangla={isBangla} />
        </div>
      </div>

      <RecentStudents students={stats.recentStudents} isBangla={isBangla} />

      <QuickActions isBangla={isBangla} />

      <UpcomingEvents events={events} isBangla={isBangla} />
    </div>
  );
}
