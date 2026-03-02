// src/app/dashboard/timetable/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getWeeklyTimetable } from "@/server/actions/timetable";
import { getClassRoutineGrid } from "@/server/actions/class-routine";
import { getSubjects } from "@/server/actions/classes";
import { getTeachers } from "@/server/actions/teachers";
import { db } from "@/lib/db";
import { TimetableClient } from "@/components/timetable/timetable-client";
import { GovtPrimaryRoutineClient } from "@/components/timetable/govt-primary-routine-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";
import { isGovtPrimaryModeEnabled } from "@/lib/config";

export const metadata: Metadata = { title: "Timetable" };
export const dynamic = "force-dynamic";
const GOVT_PRIMARY_ROUTINE_GRADES = ["1", "2", "3", "4", "5"] as const;
const GOVT_ROUTINE_FALLBACK_ROWS = [
  { dayOfWeek: 0, label: "রবিবার" },
  { dayOfWeek: 1, label: "সোমবার" },
  { dayOfWeek: 2, label: "মঙ্গলবার" },
  { dayOfWeek: 3, label: "বুধবার" },
  { dayOfWeek: 4, label: "বৃহস্পতিবার" },
].map((row) => ({
  ...row,
  periods: [1, 2, 3, 4, 5, 6].map((periodNo) => ({ periodNo, subjectName: "" })),
}));

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

  const govtPrimaryMode = isGovtPrimaryModeEnabled();
  const selectedClassId = params.classId || "";
  const classes = await safeLoader(
    "DASHBOARD_TIMETABLE_CLASSES",
    () =>
      db.class.findMany({
        where: {
          institutionId,
          isActive: true,
          ...(govtPrimaryMode
            ? { grade: { in: [...GOVT_PRIMARY_ROUTINE_GRADES] } }
            : {}),
        },
        select: { id: true, name: true, grade: true, section: true },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
      }),
    [],
    { institutionId },
  );

  if (govtPrimaryMode) {
    const effectiveClassId = selectedClassId || classes[0]?.id || "";
    const routine = await safeLoader(
      "DASHBOARD_GOVT_ROUTINE_DATA",
      () => getClassRoutineGrid(effectiveClassId || undefined),
      {
        classId: "",
        className: null,
        grade: null,
        section: null,
        rows: GOVT_ROUTINE_FALLBACK_ROWS,
      },
      { institutionId, selectedClassId: effectiveClassId },
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <Suspense fallback={<TableSkeleton />}>
          <GovtPrimaryRoutineClient
            classes={classes}
            selectedClassId={effectiveClassId}
            routine={routine}
          />
        </Suspense>
      </div>
    );
  }

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
