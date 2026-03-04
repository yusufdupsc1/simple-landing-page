import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FileSpreadsheet, Upload, Database, ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Import Center",
};

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

export default async function ImportCenterPage() {
  const session = await auth();
  const user = session?.user as
    | { institutionId?: string; role?: string }
    | undefined;

  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  if (!PRIVILEGED_ROLES.includes(user.role ?? "")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Import Center"
        description="Bring classes, students, guardians, and subject data into your tenant safely."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Student Import Workflow
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Use structured CSV batches and validate class mapping before sync.
            </p>
            <Link
              href="/dashboard/students"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Go to students module <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Subject & Class Sync
              <Upload className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Create classes and subjects first, then attach teacher mappings.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/classes"
                className="text-primary hover:underline"
              >
                Classes
              </Link>
              <Link
                href="/dashboard/subjects"
                className="text-primary hover:underline"
              >
                Subjects
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Import Reliability
              <Database className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Every import should be tenant-scoped, audited, and reversible
              through status control.
            </p>
            <Link
              href="/dashboard/control/inactive"
              className="text-primary hover:underline"
            >
              Open inactive rollback controls
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operational Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Import with institution slug context only.</p>
          <p>2. Validate email/phone uniqueness before commit.</p>
          <p>3. Keep parent/guardian mapping linked to existing students.</p>
          <p>
            4. Use Inactive Control Center for safe rollback instead of hard
            delete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
