import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getSubjects } from "@/server/actions/classes";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subjects" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SubjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId =
    (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const search = params.search || "";

  const subjects = await safeLoader(
    "DASHBOARD_SUBJECTS_DATA",
    () => getSubjects(search),
    [],
    { institutionId, search },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <SubjectsClient subjects={subjects} />
      </Suspense>
    </div>
  );
}
