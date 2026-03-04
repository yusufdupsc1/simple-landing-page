// src/app/dashboard/announcements/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getAnnouncements } from "@/server/actions/announcements";
import { AnnouncementsClient } from "@/components/announcements/announcements-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; priority?: string }>;
}

export default async function AnnouncementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (
    session?.user as { institutionId?: string } | undefined
  )?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const priority = params.priority || "";

  const data = await safeLoader(
    "DASHBOARD_ANNOUNCEMENTS_DATA",
    () => getAnnouncements({ page, search, priority }),
    { announcements: [], total: 0, pages: 1, page },
    { institutionId, page, priority },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <AnnouncementsClient
          announcements={data.announcements}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
