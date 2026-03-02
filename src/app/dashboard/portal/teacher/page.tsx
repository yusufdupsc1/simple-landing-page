import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeLoader } from "@/lib/server/safe-loader";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: isGovtPrimaryModeEnabled() ? "Assistant Teacher Portal" : "Teacher Portal",
};
export const dynamic = "force-dynamic";

async function getTeacherPortalData(
  institutionId: string,
  userId: string,
  email?: string | null,
) {
  const byUser = await db.teacher.findFirst({
    where: { institutionId, userId },
    include: {
      classTeacher: { select: { id: true, name: true, grade: true, section: true } },
      subjects: { include: { subject: { select: { id: true, name: true, code: true } } } },
    },
  });
  if (byUser) return byUser;

  if (!email) return null;

  return db.teacher.findFirst({
    where: {
      institutionId,
      email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
    },
    include: {
      classTeacher: { select: { id: true, name: true, grade: true, section: true } },
      subjects: { include: { subject: { select: { id: true, name: true, code: true } } } },
    },
  });
}

export default async function TeacherPortalPage() {
  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const roleLabel = govtPrimaryMode ? "Assistant Teacher" : "Teacher";
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string; email?: string | null; name?: string | null }
    | undefined;

  if (!user?.id || !user?.institutionId) {
    redirect("/auth/login");
  }

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const teacher = await safeLoader(
    "DASHBOARD_TEACHER_PORTAL",
    () => getTeacherPortalData(user.institutionId, user.id, user.email),
    null,
    { institutionId: user.institutionId, userId: user.id },
  );

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No {roleLabel.toLowerCase()} profile found. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome,</p>
        <h1 className="text-xl font-bold sm:text-2xl">
          {teacher.firstName} {teacher.lastName}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {roleLabel} ID: {teacher.teacherId}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Specialization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{teacher.specialization || "General"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{teacher.classTeacher.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{teacher.subjects.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((item: any) => (
                <Badge key={item.subject.id} variant="outline">
                  {item.subject.name} ({item.subject.code})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class Teacher Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.classTeacher.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {teacher.classTeacher.map((cls: any) => (
                <div key={cls.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Grade {cls.grade} • Section {cls.section}
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
