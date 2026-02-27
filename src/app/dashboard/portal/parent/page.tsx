// src/app/dashboard/portal/parent/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeLoader } from "@/lib/server/safe-loader";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Parent Portal" };
export const dynamic = "force-dynamic";

async function getParentData(institutionId: string, userId: string) {
  const parent = await db.parent.findFirst({
    where: { userId },
    include: {
      students: {
        include: {
          class: { select: { name: true } },
          grades: {
            include: { subject: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          fees: {
            orderBy: { dueDate: "desc" },
            take: 10,
          },
          attendances: {
            where: {
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const announcements = await db.announcement.findMany({
    where: {
      institutionId,
      targetAudience: { hasSome: ["ALL", "PARENTS"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return { parent, announcements };
}

export default async function ParentPortalPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user?.institutionId) {
    redirect("/auth/login");
  }

  if (user.role !== "PARENT") {
    redirect("/dashboard");
  }

  const data = await safeLoader(
    "DASHBOARD_PARENT_PORTAL",
    () => getParentData(user.institutionId, user.id),
    null,
    { institutionId: user.institutionId, userId: user.id },
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

  const { parent, announcements } = data;
  const { students } = parent;

  const totalUnpaid = students.reduce(
    (sum, student) =>
      sum +
      student.fees
        .filter((f) => f.status !== "PAID")
        .reduce((fSum, f) => fSum + Number(f.amount), 0),
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome,</p>
        <h1 className="text-xl font-bold sm:text-2xl">
          {parent.firstName} {parent.lastName}
        </h1>
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
            <CardTitle className="text-sm font-medium">
              Outstanding Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalUnpaid)}
            </div>
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

      <Tabs defaultValue={students[0]?.id}>
        <TabsList className="w-full justify-start">
          {students.map((student) => (
            <TabsTrigger key={student.id} value={student.id}>
              {student.firstName} {student.lastName}
            </TabsTrigger>
          ))}
        </TabsList>

        {students.map((student) => {
          const presentCount = student.attendances.filter(
            (a) => a.status === "PRESENT",
          ).length;
          const total = student.attendances.length;
          const attendanceRate =
            total > 0 ? Math.round((presentCount / total) * 100) : 0;

          const avgGrade =
            student.grades.length > 0
              ? Math.round(
                  student.grades.reduce((sum, g) => sum + g.percentage, 0) /
                    student.grades.length,
                )
              : null;

          const unpaidStudentFees = student.fees.filter(
            (f) => f.status !== "PAID",
          );

          return (
            <TabsContent
              key={student.id}
              value={student.id}
              className="space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.class?.name} • ID: {student.studentId}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <Badge
                    variant={attendanceRate >= 75 ? "default" : "destructive"}
                  >
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
                      <p className="text-muted-foreground text-sm">
                        No grades yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {student.grades.slice(0, 5).map((grade) => (
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
                      <p className="text-muted-foreground text-sm">
                        All fees paid!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {unpaidStudentFees.map((fee) => (
                          <div key={fee.id} className="flex justify-between gap-3 text-sm">
                            <span>{fee.title}</span>
                            <span className="font-medium">
                              {formatCurrency(Number(fee.amount))}
                            </span>
                          </div>
                        ))}
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
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border-b pb-3 last:border-0"
                >
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
