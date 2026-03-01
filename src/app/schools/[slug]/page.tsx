import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPublicSchoolSummary(slug: string) {
  const institution = await db.institution.findFirst({
    where: {
      slug: { equals: slug, mode: "insensitive" },
      isActive: true,
      settings: {
        is: {
          publicReportsEnabled: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      settings: {
        select: {
          publicReportsDescription: true,
        },
      },
    },
  });

  if (!institution) return null;

  const [
    studentTotal,
    teacherTotal,
    classTotals,
    attendance,
    gradeBands,
    payments,
    upcomingEvents,
    announcements,
  ] = await Promise.all([
    db.student.count({ where: { institutionId: institution.id, status: "ACTIVE" } }),
    db.teacher.count({ where: { institutionId: institution.id, status: "ACTIVE" } }),
    db.class.findMany({
      where: { institutionId: institution.id, isActive: true },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    db.attendance.groupBy({
      by: ["status"],
      where: {
        institutionId: institution.id,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: { status: true },
    }),
    db.grade.groupBy({
      by: ["letterGrade"],
      where: {
        institutionId: institution.id,
      },
      _count: { letterGrade: true },
    }),
    db.payment.aggregate({
      where: { institutionId: institution.id },
      _sum: { amount: true },
      _count: true,
    }),
    db.event.findMany({
      where: {
        institutionId: institution.id,
        startDate: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        location: true,
        type: true,
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    db.announcement.findMany({
      where: {
        institutionId: institution.id,
        targetAudience: { hasSome: ["ALL"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const attendanceMap = {
    present: 0,
    absent: 0,
    late: 0,
  };

  for (const row of attendance) {
    if (row.status === "PRESENT") attendanceMap.present = row._count.status;
    if (row.status === "ABSENT") attendanceMap.absent = row._count.status;
    if (row.status === "LATE") attendanceMap.late = row._count.status;
  }

  return {
    institution,
    studentTotal,
    teacherTotal,
    classTotals,
    attendanceMap,
    gradeBands,
    totalPayments: Number(payments._sum.amount ?? 0),
    paymentCount: payments._count,
    upcomingEvents,
    announcements,
  };
}

export default async function SchoolPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPublicSchoolSummary(slug);

  if (!data) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Public School Summary</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.institution.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.institution.city ?? ""}
            {data.institution.city && data.institution.country ? ", " : ""}
            {data.institution.country ?? ""}
          </p>
          {data.institution.settings?.publicReportsDescription ? (
            <p className="mt-3 text-sm text-muted-foreground">{data.institution.settings.publicReportsDescription}</p>
          ) : null}
          <Link href={`/schools/${slug}/reports`} className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
            View detailed reports
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active Students</p>
            <p className="mt-1 text-2xl font-semibold">{data.studentTotal}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active Teachers</p>
            <p className="mt-1 text-2xl font-semibold">{data.teacherTotal}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Attendance (30 days)</p>
            <p className="mt-1 text-sm font-medium">
              Present {data.attendanceMap.present} · Absent {data.attendanceMap.absent} · Late {data.attendanceMap.late}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.totalPayments)}</p>
            <p className="text-xs text-muted-foreground">{data.paymentCount} payments</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Students by Class</h2>
            <div className="mt-3 space-y-2">
              {data.classTotals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes published.</p>
              ) : (
                data.classTotals.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
                    <span>{cls.name}</span>
                    <span className="font-medium">{cls._count.students}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Grade Distribution</h2>
            <div className="mt-3 space-y-2">
              {data.gradeBands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grade data published.</p>
              ) : (
                data.gradeBands.map((row) => (
                  <div key={row.letterGrade ?? "UNSPECIFIED"} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
                    <span>{row.letterGrade || "Unspecified"}</span>
                    <span className="font-medium">{row._count.letterGrade}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Upcoming Events</h2>
            <div className="mt-3 space-y-2">
              {data.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public upcoming events.</p>
              ) : (
                data.upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-md border border-border/60 p-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()} • {event.type}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Public Announcements</h2>
            <div className="mt-3 space-y-2">
              {data.announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements published.</p>
              ) : (
                data.announcements.map((item) => (
                  <div key={item.id} className="rounded-md border border-border/60 p-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
