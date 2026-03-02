import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsWorkspace } from "@/components/students/reports-workspace";
import { isGovtPrimaryModeEnabled, PRIMARY_GRADES } from "@/lib/config";

export const metadata: Metadata = {
  title: "Student Reports",
};

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;

  if (!institutionId) {
    return null;
  }

  const classes = await db.class.findMany({
    where: {
      institutionId,
      isActive: true,
      ...(isGovtPrimaryModeEnabled()
        ? { grade: { in: [...PRIMARY_GRADES] } }
        : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ready-Made Student Reports"
        description="Generate class-wise Bangladeshi-style certificates and progress PDFs"
      />
      <ReportsWorkspace classes={classes} />
    </div>
  );
}
