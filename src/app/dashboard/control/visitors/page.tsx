import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Globe, Eye, ShieldCheck, Users, Megaphone } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Visitor Control",
};

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

export default async function VisitorControlPage() {
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

  const institutionId = user.institutionId;

  const [institution, settings, announcementCount, eventCount, studentCount] =
    await Promise.all([
      db.institution.findUnique({
        where: { id: institutionId },
        select: { id: true, slug: true, name: true },
      }),
      db.institutionSettings.findUnique({
        where: { institutionId },
        select: {
          publicReportsEnabled: true,
          publicReportsDescription: true,
          emailNotifs: true,
          smsNotifs: true,
        },
      }),
      db.announcement.count({ where: { institutionId } }),
      db.event.count({
        where: {
          institutionId,
          startDate: { gte: new Date() },
        },
      }),
      db.student.count({ where: { institutionId, status: "ACTIVE" } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor & Guest Control"
        description="Manage what guests can view and how your school is presented publicly."
      >
        <Link
          href="/dashboard/settings?tab=academic"
          className="inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/50"
        >
          Configure Public Reports
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              Public School Page
              <Globe className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-sm text-muted-foreground">
              /schools/{institution?.slug ?? "school"}
            </p>
            <Badge
              variant={settings?.publicReportsEnabled ? "success" : "outline"}
            >
              {settings?.publicReportsEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              Guest-safe Metrics
              <Eye className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
            <p>
              Active students:{" "}
              <span className="font-semibold text-foreground">
                {studentCount}
              </span>
            </p>
            <p>
              Upcoming events:{" "}
              <span className="font-semibold text-foreground">
                {eventCount}
              </span>
            </p>
            <p>
              Announcements:{" "}
              <span className="font-semibold text-foreground">
                {announcementCount}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              Visitor Communication
              <Megaphone className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
            <p>
              Email alerts:{" "}
              <span className="font-semibold text-foreground">
                {settings?.emailNotifs ? "On" : "Off"}
              </span>
            </p>
            <p>
              SMS alerts:{" "}
              <span className="font-semibold text-foreground">
                {settings?.smsNotifs ? "On" : "Off"}
              </span>
            </p>
            <p>
              Privacy scope:{" "}
              <span className="font-semibold text-foreground">
                Aggregated only
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Visitor Policy
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Public pages expose only aggregate-level school stats. No personal
            data (student names, IDs, emails, phone numbers, grades, or
            attendance records) is disclosed to guests.
          </p>
          <p>
            Description shown publicly:
            <span className="ml-1 font-medium text-foreground">
              {settings?.publicReportsDescription?.trim() ||
                "No custom description set"}
            </span>
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Recommended Next Step
            </p>
            <Link
              href="/dashboard/settings?tab=academic"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Users className="h-4 w-4" /> Review guest visibility and update
              school description
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
