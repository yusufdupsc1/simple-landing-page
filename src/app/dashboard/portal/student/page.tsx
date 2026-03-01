// src/app/dashboard/portal/student/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeLoader } from "@/lib/server/safe-loader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FeePaymentActions } from "@/components/finance/fee-payment-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student Portal" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ payment?: string; gateway?: string }>;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
}

function phoneTail(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function getStudentData(
  institutionId: string,
  userEmail?: string | null,
  userPhone?: string | null,
) {
  const normalizedEmail = userEmail?.trim().toLowerCase();
  const normalizedPhoneTail = phoneTail(userPhone);
  if (!normalizedEmail && !normalizedPhoneTail) return null;

  const student = await db.student.findFirst({
    where: {
      institutionId,
      OR: [
        ...(normalizedEmail
          ? [{ email: { equals: normalizedEmail, mode: "insensitive" as const } }]
          : []),
        ...(normalizedPhoneTail ? [{ phone: { contains: normalizedPhoneTail } }] : []),
      ],
    },
    include: {
      class: {
        include: {
          classTeacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!student) return null;

  const grades = await db.grade.findMany({
    where: { studentId: student.id },
    include: { subject: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await db.attendance.findMany({
    where: {
      studentId: student.id,
      date: { gte: thirtyDaysAgo },
    },
  });

  const attendanceSummary: AttendanceSummary = {
    present: attendanceRecords.filter((r) => r.status === "PRESENT").length,
    absent: attendanceRecords.filter((r) => r.status === "ABSENT").length,
    late: attendanceRecords.filter((r) => r.status === "LATE").length,
    total: attendanceRecords.length,
  };

  const fees = await db.fee.findMany({
    where: { studentId: student.id },
    include: {
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: "desc" },
    take: 10,
  });

  const announcements = await db.announcement.findMany({
    where: {
      institutionId,
      targetAudience: { hasSome: ["ALL", "STUDENTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return {
    student,
    grades,
    attendanceSummary,
    fees,
    announcements,
  };
}

export default async function StudentPortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const user = session?.user as
    | { institutionId?: string; role?: string; email?: string | null; phone?: string | null }
    | undefined;

  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const data = await safeLoader(
    "DASHBOARD_STUDENT_PORTAL",
    () => getStudentData(user.institutionId, user.email, user.phone),
    null,
    { institutionId: user.institutionId, userEmail: user.email, userPhone: user.phone },
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No student record found. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, grades, attendanceSummary, fees, announcements } = data;
  const attendanceRate =
    attendanceSummary.total > 0
      ? Math.round(
          ((attendanceSummary.present + attendanceSummary.late * 0.5) /
            attendanceSummary.total) *
            100,
        )
      : 0;

  const unpaidFees = fees.filter((f) => ["UNPAID", "PARTIAL", "OVERDUE"].includes(f.status));
  const totalUnpaid = unpaidFees.reduce((sum, fee) => {
    const paid = (fee.payments ?? []).reduce((paidSum: number, payment: any) => paidSum + Number(payment.amount), 0);
    return sum + Math.max(0, Number(fee.amount) - paid);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {params.payment ? (
        <Card
          className={
            params.payment === "success"
              ? "border-green-500/40 bg-green-500/5"
              : "border-yellow-500/40 bg-yellow-500/5"
          }
        >
          <CardContent className="py-3 text-sm">
            {params.payment === "success"
              ? `Payment received via ${params.gateway ?? "gateway"}.`
              : `Payment ${params.payment}. You can try again.`}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-xl font-bold sm:text-2xl">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {student.class?.name} • ID: {student.studentId}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceSummary.present} present, {attendanceSummary.absent}{" "}
              absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades.length > 0
                ? Math.round(
                    grades.reduce((sum, g) => sum + g.percentage, 0) /
                      grades.length,
                  )
                : "N/A"}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {grades.length} grades recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {unpaidFees.length} unpaid fees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No grades recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {grades.slice(0, 5).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">
                        {grade.subject.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {grade.term}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          grade.percentage >= 60 ? "default" : "destructive"
                        }
                      >
                        {grade.letterGrade || "N/A"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {grade.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Status</CardTitle>
          </CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <p className="text-muted-foreground text-sm">No fees assigned.</p>
            ) : (
              <div className="space-y-3">
                {fees.slice(0, 5).map((fee) => (
                  <div key={fee.id} className="rounded-lg border border-border/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{fee.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(fee.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            fee.status === "PAID"
                              ? "default"
                              : fee.status === "PARTIAL"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {fee.status}
                        </Badge>
                        <p className="text-xs font-medium">
                          {formatCurrency(Number(fee.amount))}
                        </p>
                      </div>
                    </div>
                    {["UNPAID", "PARTIAL", "OVERDUE"].includes(fee.status) ? (
                      <FeePaymentActions feeId={fee.id} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border-b pb-3 last:border-0"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <Badge variant="outline">{announcement.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
