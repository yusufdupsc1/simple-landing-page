// src/app/dashboard/settings/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstitutionSettings } from "@/server/actions/settings";
import { SettingsClient } from "@/components/settings/settings-client";
import { safeLoader } from "@/lib/server/safe-loader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as { institutionId?: string; role?: string } | undefined;

  if (!user?.role || !["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(user.role)) {
    redirect("/dashboard");
  }

  const { institution, settings } = await safeLoader(
    "DASHBOARD_SETTINGS_DATA",
    () => getInstitutionSettings(),
    { institution: null, settings: null },
    { institutionId: user.institutionId },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <SettingsClient
        institution={institution}
        settings={settings}
        viewerRole={user.role}
      />
    </div>
  );
}
