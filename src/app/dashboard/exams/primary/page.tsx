import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGovtPrimaryModeEnabled } from "@/lib/config";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import { PrimaryExamClient } from "@/components/exams/primary-exam-client";
import {
  getPrimaryExamResultData,
  getPrimaryExams,
} from "@/server/actions/primary-exams";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Primary Exams" };
export const dynamic = "force-dynamic";

const PRIMARY_EXAM_GRADES = ["1", "2", "3", "4", "5"] as const;

interface PageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function PrimaryExamsPage({ searchParams }: PageProps) {
  if (!isGovtPrimaryModeEnabled()) {
    redirect("/dashboard/grades");
  }

  const params = await searchParams;
  const session = await auth();
  const institutionId =
    (session?.user as { institutionId?: string } | undefined)?.institutionId;

  if (!institutionId) {
    redirect("/auth/login");
  }

  const classes = await safeLoader(
    "DASHBOARD_PRIMARY_EXAM_CLASSES",
    () =>
      db.class.findMany({
        where: {
          institutionId,
          isActive: true,
          grade: { in: [...PRIMARY_EXAM_GRADES] },
        },
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
        },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
      }),
    [],
    { institutionId },
  );

  const exams = await safeLoader(
    "DASHBOARD_PRIMARY_EXAMS",
    () => getPrimaryExams(),
    [],
    { institutionId },
  );

  const selectedExamId =
    (params.examId && exams.some((exam) => exam.id === params.examId)
      ? params.examId
      : exams[0]?.id) ?? "";

  const resultData = selectedExamId
    ? await safeLoader(
        "DASHBOARD_PRIMARY_EXAM_RESULT_DATA",
        () => getPrimaryExamResultData(selectedExamId),
        null,
        { institutionId, selectedExamId },
      )
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <PrimaryExamClient
          key={selectedExamId || "none"}
          classes={classes}
          exams={exams}
          selectedExamId={selectedExamId}
          resultData={resultData}
        />
      </Suspense>
    </div>
  );
}
