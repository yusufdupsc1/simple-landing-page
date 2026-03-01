// src/app/dashboard/classes/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClasses } from "@/server/actions/classes";
import { getTeachers } from "@/server/actions/teachers";
import { ClassesOnlyClient } from "@/components/classes/classes-only-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Classes" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const tab = params.tab || "classes";

  if (tab === "subjects") {
    redirect("/dashboard/subjects");
  }

  const classData = await safeLoader(
    "DASHBOARD_CLASSES_DATA",
    () => getClasses({ page, search }),
    { classes: [], total: 0, pages: 1, page },
    { institutionId, page },
  );
  const teachers = await safeLoader(
    "DASHBOARD_CLASSES_TEACHERS",
    () => getTeachers({ limit: 200, status: "ACTIVE" }),
    { teachers: [], total: 0, pages: 1, page: 1 },
    { institutionId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <ClassesOnlyClient
          classes={classData.classes}
          teachers={teachers.teachers}
          total={classData.total}
          pages={classData.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
