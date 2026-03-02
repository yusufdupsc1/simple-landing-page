// src/app/dashboard/timetable/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getWeeklyTimetable } from "@/server/actions/timetable";
import { getSubjects } from "@/server/actions/classes";
import { getTeachers } from "@/server/actions/teachers";
import { db } from "@/lib/db";
import { TimetableClient } from "@/components/timetable/timetable-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";

export const metadata: Metadata = { title: "Timetable" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default async function TimetablePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (
    session?.user as { institutionId?: string } | undefined
  )?.institutionId;

  if (!institutionId) return null;

  const selectedClassId = params.classId || "";
  const classes = await safeLoader(
    "DASHBOARD_TIMETABLE_CLASSES",
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
  const timetable = await safeLoader(
    "DASHBOARD_TIMETABLE_DATA",
    () => getWeeklyTimetable(selectedClassId || undefined),
    [
      { day: "Sunday", dayIndex: 0, entries: [] },
      { day: "Monday", dayIndex: 1, entries: [] },
      { day: "Tuesday", dayIndex: 2, entries: [] },
      { day: "Wednesday", dayIndex: 3, entries: [] },
      { day: "Thursday", dayIndex: 4, entries: [] },
      { day: "Friday", dayIndex: 5, entries: [] },
      { day: "Saturday", dayIndex: 6, entries: [] },
    ],
    { institutionId, selectedClassId },
  );
  const subjects = await safeLoader(
    "DASHBOARD_TIMETABLE_SUBJECTS",
    () => getSubjects(),
    [],
    { institutionId },
  );
  const teachers = await safeLoader(
    "DASHBOARD_TIMETABLE_TEACHERS",
    () => getTeachers({ limit: 500, status: "ACTIVE" }),
    { teachers: [], total: 0, pages: 1, page: 1 },
    { institutionId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <TimetableClient
          classes={classes}
          timetable={timetable}
          subjects={subjects}
          teachers={teachers.teachers}
          selectedClassId={selectedClassId}
        />
      </Suspense>
    </div>
  );
}
