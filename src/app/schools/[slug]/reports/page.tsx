import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

async function getPublicReports(slug: string) {
  const institution = await db.institution.findFirst({
    where: {
      slug: { equals: slug, mode: "insensitive" },
      isActive: true,
      settings: { is: { publicReportsEnabled: true } },
    },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      settings: { select: { publicReportsDescription: true } },
    },
  });

  if (!institution) return null;

  const now = new Date();
  const attendanceFrom = new Date(now.getTime() - 29 * DAY_MS);
  const monthlyFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [
    studentTotal,
    teacherTotal,
    classes,
    attendanceRows,
    gradeRows,
    payments,
    events,
    announcements,
  ] = await Promise.all([
    db.student.count({ where: { institutionId: institution.id, status: "ACTIVE" } }),
    db.teacher.count({ where: { institutionId: institution.id, status: "ACTIVE" } }),
    db.class.findMany({
      where: {
        institutionId: institution.id,
        isActive: true,
        ...(isGovtPrimaryModeEnabled()
          ? { grade: { in: [...PRIMARY_GRADES] } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    db.attendance.groupBy({
      by: ["date", "status"],
      where: {
        institutionId: institution.id,
        date: { gte: attendanceFrom },
      },
      _count: { status: true },
      orderBy: [{ date: "asc" }],
    }),
    db.grade.groupBy({
      by: ["letterGrade"],
      where: { institutionId: institution.id },
      _count: { letterGrade: true },
      orderBy: { letterGrade: "asc" },
    }),
    db.payment.findMany({
      where: {
        institutionId: institution.id,
        paidAt: { gte: monthlyFrom },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: "asc" },
    }),
    db.event.findMany({
      where: {
        institutionId: institution.id,
        startDate: { gte: now },
      },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    db.announcement.findMany({
      where: {
        institutionId: institution.id,
        targetAudience: { hasSome: ["ALL"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
  ]);

  const attendanceMap = new Map<
    string,
    { date: string; present: number; absent: number; late: number; excused: number }
  >();

  for (let i = 0; i < 30; i += 1) {
    const key = toDayKey(new Date(attendanceFrom.getTime() + i * DAY_MS));
    attendanceMap.set(key, {
      date: key,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    });
  }

  for (const row of attendanceRows) {
    const key = toDayKey(row.date);
    const bucket = attendanceMap.get(key);
    if (!bucket) continue;

    if (row.status === "PRESENT") bucket.present += row._count.status;
    if (row.status === "ABSENT") bucket.absent += row._count.status;
    if (row.status === "LATE") bucket.late += row._count.status;
    if (row.status === "EXCUSED") bucket.excused += row._count.status;
  }

  const attendanceSeries = Array.from(attendanceMap.values());

  const monthMap = new Map<string, { label: string; total: number }>();
  for (let i = 0; i < 12; i += 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    const key = monthDate.toISOString().slice(0, 7);
    monthMap.set(key, { label: toMonthLabel(monthDate), total: 0 });
  }

  for (const payment of payments) {
    const key = payment.paidAt.toISOString().slice(0, 7);
    const bucket = monthMap.get(key);
    if (bucket) {
      bucket.total += Number(payment.amount);
    }
  }

  const monthlyCollections = Array.from(monthMap.values());
  const totalCollected = monthlyCollections.reduce((sum, row) => sum + row.total, 0);
  const peakMonth = monthlyCollections.reduce(
    (best, row) => (row.total > best.total ? row : best),
    { label: "-", total: 0 },
  );

  return {
    institution,
    studentTotal,
    teacherTotal,
    classes,
    attendanceSeries,
    gradeRows,
    monthlyCollections,
    totalCollected,
    peakMonth,
    events,
    announcements,
  };
}

export default async function SchoolReportsPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPublicReports(slug);

  if (!data) notFound();

  const peakMonthAmount = Math.max(
    1,
    ...data.monthlyCollections.map((row) => row.total),
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Public Reports
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.institution.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.institution.city ?? ""}
            {data.institution.city && data.institution.country ? ", " : ""}
            {data.institution.country ?? ""}
          </p>
          {data.institution.settings?.publicReportsDescription ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {data.institution.settings.publicReportsDescription}
            </p>
          ) : null}
          <Link
            href={`/schools/${slug}`}
            className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to school summary
          </Link>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active Students</p>
            <p className="mt-1 text-2xl font-semibold">{data.studentTotal}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active Teachers</p>
            <p className="mt-1 text-2xl font-semibold">{data.teacherTotal}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Collections (12 months)</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.totalCollected)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Peak Month</p>
            <p className="mt-1 text-sm font-semibold">{data.peakMonth.label}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(data.peakMonth.total)}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Attendance Trend (Last 30 Days)</h2>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
              {data.attendanceSeries.map((row) => {
                const total = row.present + row.absent + row.late + row.excused;
                const presentWidth = total > 0 ? (row.present / total) * 100 : 0;
                const absentWidth = total > 0 ? (row.absent / total) * 100 : 0;
                const lateWidth = total > 0 ? (row.late / total) * 100 : 0;
                const excusedWidth = total > 0 ? (row.excused / total) * 100 : 0;

                return (
                  <div key={row.date} className="rounded-md border border-border/70 p-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{new Date(`${row.date}T00:00:00Z`).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">Total {total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${presentWidth}%` }}
                      />
                      <div
                        className="-mt-2 h-2 bg-rose-500"
                        style={{ width: `${absentWidth}%`, marginLeft: `${presentWidth}%` }}
                      />
                      <div
                        className="-mt-2 h-2 bg-amber-500"
                        style={{
                          width: `${lateWidth}%`,
                          marginLeft: `${presentWidth + absentWidth}%`,
                        }}
                      />
                      <div
                        className="-mt-2 h-2 bg-sky-500"
                        style={{
                          width: `${excusedWidth}%`,
                          marginLeft: `${presentWidth + absentWidth + lateWidth}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Green: Present, Red: Absent, Amber: Late, Blue: Excused.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Fee Collection by Month</h2>
            <div className="mt-3 space-y-2">
              {data.monthlyCollections.map((row) => {
                const width = (row.total / peakMonthAmount) * 100;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{row.label}</span>
                      <span className="font-medium">{formatCurrency(row.total)}</span>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{ width: `${Math.max(2, width)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Students by Class</h2>
            <div className="mt-3 space-y-2">
              {data.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active classes.</p>
              ) : (
                data.classes.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm"
                  >
                    <span>{classItem.name || `${classItem.grade}-${classItem.section}`}</span>
                    <span className="font-medium">{classItem._count.students}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Grade Distribution</h2>
            <div className="mt-3 space-y-2">
              {data.gradeRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No published grade data.</p>
              ) : (
                data.gradeRows.map((row) => (
                  <div
                    key={row.letterGrade ?? "UNSPECIFIED"}
                    className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm"
                  >
                    <span>{row.letterGrade || "Unspecified"}</span>
                    <span className="font-medium">{row._count.letterGrade}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Public Activity Feed</h2>
            <div className="mt-3 space-y-2">
              {data.events.map((event) => (
                <div key={event.id} className="rounded-md border border-border/60 p-2 text-sm">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Event • {event.type} • {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {data.announcements.map((item) => (
                <div key={item.id} className="rounded-md border border-border/60 p-2 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Announcement • {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {data.events.length === 0 && data.announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public items published.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
