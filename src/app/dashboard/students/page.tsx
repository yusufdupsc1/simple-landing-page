// src/app/dashboard/students/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getStudents } from "@/server/actions/students";
import { db } from "@/lib/db";
import { StudentsTable } from "@/components/students/students-table";
import { StudentsHeader } from "@/components/students/students-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classId?: string;
    status?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams; // Next.js 15+ — searchParams is a Promise
  const session = await auth();

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const classId = params.classId || "";
  const status = params.status || "ACTIVE";

  const [data, classes] = await Promise.all([
    getStudents({ page, search, classId, status }),
    db.class.findMany({
      where: { institutionId: session!.user.institutionId, isActive: true },
      select: { id: true, name: true, grade: true, section: true },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <StudentsHeader total={data.total} />

      <Suspense fallback={<TableSkeleton />}>
        <StudentsTable
          students={data.students}
          classes={classes}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
