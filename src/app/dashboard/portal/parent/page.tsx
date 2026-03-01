import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeLoader } from "@/lib/server/safe-loader";
import { formatCurrency } from "@/lib/utils";
import { FeePaymentActions } from "@/components/finance/fee-payment-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Parent Portal" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ payment?: string; gateway?: string }>;
}

function phoneTail(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function getParentData(
  institutionId: string,
  userEmail?: string | null,
  userPhone?: string | null,
) {
  const normalizedEmail = userEmail?.trim().toLowerCase();
  const normalizedPhoneTail = phoneTail(userPhone);
  if (!normalizedEmail && !normalizedPhoneTail) return null;

  const parentLinks = await db.parent.findMany({
    where: {
      student: { institutionId },
      OR: [
        ...(normalizedEmail
          ? [{ email: { equals: normalizedEmail, mode: "insensitive" as const } }]
          : []),
        ...(normalizedPhoneTail ? [{ phone: { contains: normalizedPhoneTail } }] : []),
      ],
    },
    include: {
      student: {
        include: {
          class: { select: { name: true } },
          grades: {
            include: { subject: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          fees: {
            include: { payments: { select: { amount: true } } },
            orderBy: { dueDate: "desc" },
            take: 10,
          },
          attendance: {
            where: {
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        },
      },
    },
  });

  if (parentLinks.length === 0) return null;

  const announcements = await db.announcement.findMany({
    where: {
      institutionId,
      targetAudience: { hasSome: ["ALL", "PARENTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return {
    parentName: `${parentLinks[0].firstName} ${parentLinks[0].lastName}`.trim(),
    students: parentLinks.map((link: any) => ({
      relation: link.relation,
      student: link.student,
    })),
    announcements,
  };
}

export default async function ParentPortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const user = session?.user as
    | { institutionId?: string; role?: string; email?: string | null; phone?: string | null }
    | undefined;

  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  if (user.role !== "PARENT") {
    redirect("/dashboard");
  }

  const data = await safeLoader(
    "DASHBOARD_PARENT_PORTAL",
    () => getParentData(user.institutionId, user.email, user.phone),
    null,
    { institutionId: user.institutionId, userEmail: user.email, userPhone: user.phone },
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No parent record found. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { parentName, announcements, students } = data;
  const totalUnpaid = students.reduce((sum: number, row: any) => {
    const unpaidTotal = row.student.fees
      .filter((f: any) => ["UNPAID", "PARTIAL", "OVERDUE"].includes(f.status))
      .reduce((feeSum: number, fee: any) => {
        const paid = (fee.payments ?? []).reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
        return feeSum + Math.max(0, Number(fee.amount) - paid);
      }, 0);
    return sum + unpaidTotal;
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
        <p className="text-sm text-muted-foreground">Welcome,</p>
        <h1 className="text-xl font-bold sm:text-2xl">{parentName}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Managing {students.length} student{students.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={students[0]?.student.id}>
        <TabsList className="w-full justify-start">
          {students.map((row: any) => (
            <TabsTrigger key={row.student.id} value={row.student.id}>
              {row.student.firstName} {row.student.lastName}
            </TabsTrigger>
          ))}
        </TabsList>

        {students.map((row: any) => {
          const student = row.student;
          const presentCount = student.attendance.filter((a: any) => a.status === "PRESENT").length;
          const total = student.attendance.length;
          const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

          const avgGrade =
            student.grades.length > 0
              ? Math.round(
                  student.grades.reduce((sum: number, g: any) => sum + g.percentage, 0) /
                    student.grades.length,
                )
              : null;

          const unpaidStudentFees = student.fees.filter((f: any) =>
            ["UNPAID", "PARTIAL", "OVERDUE"].includes(f.status),
          );

          return (
            <TabsContent key={student.id} value={student.id} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.class?.name} • ID: {student.studentId} • {row.relation}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <Badge variant={attendanceRate >= 75 ? "default" : "destructive"}>
                    {attendanceRate}% Attendance
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Grades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.grades.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No grades yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {student.grades.slice(0, 5).map((grade: any) => (
                          <div key={grade.id} className="flex justify-between gap-3 text-sm">
                            <span>{grade.subject.name}</span>
                            <span className="font-medium">
                              {grade.percentage}% ({grade.letterGrade})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {avgGrade !== null && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="text-lg font-bold">{avgGrade}%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fee Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unpaidStudentFees.length === 0 ? (
                      <p className="text-muted-foreground text-sm">All fees paid!</p>
                    ) : (
                      <div className="space-y-3">
                        {unpaidStudentFees.map((fee: any) => {
                          const paid = (fee.payments ?? []).reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
                          const remaining = Math.max(0, Number(fee.amount) - paid);
                          return (
                            <div key={fee.id} className="rounded-lg border border-border/70 p-3">
                              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                <span>{fee.title}</span>
                                <span className="font-medium">{formatCurrency(remaining)}</span>
                              </div>
                              <FeePaymentActions feeId={fee.id} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement: any) => (
                <div key={announcement.id} className="border-b pb-3 last:border-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">{announcement.title}</p>
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
