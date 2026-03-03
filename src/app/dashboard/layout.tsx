// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarServer } from "@/components/layout/sidebar.server";
import { TopBarServer } from "@/components/layout/topbar.server";
import { MobileNavServer } from "@/components/layout/mobile-nav.server";
import { AppToaster } from "@/components/layout/app-toaster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <>
      <a
        href="#dashboard-main"
        className="sr-only absolute left-3 top-3 z-[100] rounded-md bg-background px-3 py-2 text-sm text-foreground shadow focus:not-sr-only"
      >
        Skip to main content
      </a>
      <div className="safe-bottom flex min-h-svh overflow-hidden bg-background/80">
        {/* Desktop Sidebar */}
        <SidebarServer session={session} />

        {/* Main area */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <TopBarServer session={session} />

          {/* Page content */}
          <main id="dashboard-main" className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
              <div className="pb-24 lg:pb-2">{children}</div>
            </div>
          </main>
        </div>

        {/* Mobile Nav */}
        <MobileNavServer session={session} />
      </div>
      <AppToaster />
    </>
  );
}
