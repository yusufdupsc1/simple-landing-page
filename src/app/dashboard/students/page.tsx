// src/app/dashboard/students/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getStudents } from "@/server/actions/students";
import { db } from "@/lib/db";
import { StudentsTableServer } from "@/components/students/students-table.server";
import { StudentsToolbar } from "@/components/students/students-toolbar.client";
import { StudentDialogs } from "@/components/students/student-dialogs.client";
import { StudentsHeader } from "@/components/students/students-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";

export const metadata: Metadata = {
  title: "Students",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classId?: string;
    status?: string;
    dialog?: string;
    edit?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (
    session?.user as { institutionId?: string } | undefined
  )?.institutionId;
  if (!institutionId) {
    return null;
  }

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const classId = params.classId || "";
  const status = params.status || "ACTIVE";

  const data = await safeLoader(
    "DASHBOARD_STUDENTS_DATA",
    () => getStudents({ page, search, classId, status }),
    { students: [], total: 0, pages: 1, page },
    { institutionId, page, classId, status },
  );

  const classes = await safeLoader(
    "DASHBOARD_STUDENTS_CLASSES",
    () =>
      db.class.findMany({
        where: {
          institutionId,
          isActive: true,
          ...(isGovtPrimaryModeEnabled()
            ? { grade: { in: [...PRIMARY_GRADES] } }
            : {}),
        },
        select: { id: true, name: true, grade: true, section: true },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
      }),
    [],
    { institutionId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <StudentsHeader total={data.total} />

      <section className="rounded-lg border border-border bg-card p-4">
        <StudentsToolbar
          total={data.total}
          currentPage={page}
          pages={data.pages}
          hasStudents={data.students.length > 0}
        />

        <Suspense fallback={<TableSkeleton />}>
          <StudentsTableServer students={data.students as any} />
        </Suspense>

        <StudentDialogs classes={classes} allStudents={data.students as any} />
      </section>
    </div>
  );
}
