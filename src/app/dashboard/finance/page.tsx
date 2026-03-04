// src/app/dashboard/finance/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  getFees,
  getFinanceSummary,
  getGovtPrimaryFeePresets,
} from "@/server/actions/finance";
import { db } from "@/lib/db";
import { FinanceClient } from "@/components/finance/finance-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";

export const metadata: Metadata = { title: "Finance" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    term?: string;
  }>;
}

export default async function FinancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const user = session?.user as
    | { institutionId?: string; role?: string }
    | undefined;
  const institutionId = user?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "";
  const term = params.term || "";

  const data = await safeLoader(
    "DASHBOARD_FINANCE_FEES",
    () => getFees({ page, search, status, term }),
    { fees: [], total: 0, pages: 1, page },
    { institutionId, page, status, term },
  );
  const summary = await safeLoader(
    "DASHBOARD_FINANCE_SUMMARY",
    () => getFinanceSummary(),
    {
      totalFees: { amount: 0, count: 0 },
      paidFees: { amount: 0, count: 0 },
      pendingFees: { amount: 0, count: 0 },
      overdueCount: 0,
      monthlyRevenue: [],
    },
    { institutionId },
  );
  const students = await safeLoader(
    "DASHBOARD_FINANCE_STUDENTS",
    () =>
      db.student.findMany({
        where: {
          institutionId,
          status: "ACTIVE",
          ...(isGovtPrimaryModeEnabled()
            ? { class: { grade: { in: [...PRIMARY_GRADES] } } }
            : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
          classId: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        take: 500,
      }),
    [],
    { institutionId },
  );
  const feePresets = await safeLoader(
    "DASHBOARD_FINANCE_PRESETS",
    () => getGovtPrimaryFeePresets(),
    [],
    { institutionId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <FinanceClient
          fees={data.fees}
          students={students}
          summary={summary}
          feePresets={feePresets}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
