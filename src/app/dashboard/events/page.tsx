// src/app/dashboard/events/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getEvents } from "@/server/actions/events";
import { EventsClient } from "@/components/events/events-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (
    session?.user as { institutionId?: string } | undefined
  )?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const type = params.type || "";

  const data = await safeLoader(
    "DASHBOARD_EVENTS_DATA",
    () => getEvents({ page, search, type }),
    { events: [], total: 0, pages: 1, page },
    { institutionId, page, type },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <EventsClient
          events={data.events}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
