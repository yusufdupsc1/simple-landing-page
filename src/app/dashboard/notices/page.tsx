import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import { NoticeBoardClient } from "@/components/notices/notice-board-client";
import { getNotices } from "@/server/actions/notices";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notice Board" };
export const dynamic = "force-dynamic";

const PRIMARY_NOTICE_GRADES = ["1", "2", "3", "4", "5"] as const;

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default async function NoticesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId =
    (session?.user as { institutionId?: string } | undefined)?.institutionId;

  if (!institutionId) {
    redirect("/auth/login");
  }

  const classes = await safeLoader(
    "DASHBOARD_NOTICE_CLASSES",
    () =>
      db.class.findMany({
        where: {
          institutionId,
          isActive: true,
          grade: { in: [...PRIMARY_NOTICE_GRADES] },
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

  const selectedClassId =
    params.classId && classes.some((classItem) => classItem.id === params.classId)
      ? params.classId
      : "";

  const notices = await safeLoader(
    "DASHBOARD_NOTICE_LIST",
    () => getNotices({ classId: selectedClassId }),
    [],
    { institutionId, selectedClassId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <NoticeBoardClient
          classes={classes}
          notices={notices}
          selectedClassId={selectedClassId}
        />
      </Suspense>
    </div>
  );
}
