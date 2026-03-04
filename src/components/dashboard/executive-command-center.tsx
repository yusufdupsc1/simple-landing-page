import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  FileSignature,
  Globe,
  KeyRound,
  Layers3,
  ShieldAlert,
  Users2,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RoleMix = {
  admins: number;
  principals: number;
  teachers: number;
  students: number;
  parents: number;
};

type InactiveStats = {
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
};

interface ExecutiveCommandCenterProps {
  institutionSlug: string;
  profileCompletion: number;
  signatureReady: boolean;
  logoReady: boolean;
  publicReportsEnabled: boolean;
  pendingAccessRequests: number;
  parentAccounts: number;
  roleMix: RoleMix;
  inactive: InactiveStats;
  sslCommerzConfigured: boolean;
  stripeConfigured?: boolean;
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        active
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-rose-500/15 text-rose-700",
      )}
    >
      {label}: {active ? "Ready" : "Needs setup"}
    </span>
  );
}

export function ExecutiveCommandCenter({
  institutionSlug,
  profileCompletion,
  signatureReady,
  logoReady,
  publicReportsEnabled,
  pendingAccessRequests,
  parentAccounts,
  roleMix,
  inactive,
  sslCommerzConfigured,
  stripeConfigured,
}: ExecutiveCommandCenterProps) {
  const totalInactive =
    inactive.students +
    inactive.teachers +
    inactive.classes +
    inactive.subjects;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              Executive Command Center
            </p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Governance, Identity, and Growth Controls
            </h2>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Open System Controls
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-border/70 bg-card/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Institution Readiness</p>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold leading-none">
              {profileCompletion}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Profile completeness (logo, contacts, identity)
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusPill label="Logo" active={logoReady} />
              <StatusPill label="Signature" active={signatureReady} />
              <StatusPill label="Guest Reports" active={publicReportsEnabled} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/settings?tab=profile"
                className="text-xs font-medium text-primary hover:underline"
              >
                Branding
              </Link>
              <Link
                href="/dashboard/settings?tab=academic"
                className="text-xs font-medium text-primary hover:underline"
              >
                Signatures
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Access Governance</p>
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold leading-none">
              {pendingAccessRequests}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pending teacher/student/parent approvals
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/70 p-2">
                Admins:{" "}
                <span className="font-semibold text-foreground">
                  {roleMix.admins}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Principals:{" "}
                <span className="font-semibold text-foreground">
                  {roleMix.principals}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Teachers:{" "}
                <span className="font-semibold text-foreground">
                  {roleMix.teachers}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Parents:{" "}
                <span className="font-semibold text-foreground">
                  {parentAccounts}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings?tab=access"
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            >
              Review access queue
            </Link>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/95 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Risk Radar</p>
              <ShieldAlert className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold leading-none">{totalInactive}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Inactive records requiring review/reactivation
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/70 p-2">
                Students:{" "}
                <span className="font-semibold text-foreground">
                  {inactive.students}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Teachers:{" "}
                <span className="font-semibold text-foreground">
                  {inactive.teachers}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Classes:{" "}
                <span className="font-semibold text-foreground">
                  {inactive.classes}
                </span>
              </div>
              <div className="rounded-lg border border-border/70 p-2">
                Subjects:{" "}
                <span className="font-semibold text-foreground">
                  {inactive.subjects}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/control/inactive"
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            >
              Open inactive control center
            </Link>
          </article>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border/70 bg-card/90 p-4">
            <div className="mb-2 flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Payments Infrastructure</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Gateway readiness for regional and global fee collection.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill label="SSLCommerz" active={sslCommerzConfigured} />
              {typeof stripeConfigured === "boolean" ? (
                <StatusPill label="Stripe" active={stripeConfigured} />
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/90 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Guest & Visitor Surface</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Public school report visibility and guest-safe disclosure
              controls.
            </p>
            <div className="mt-2 rounded-lg border border-border/70 p-2 text-xs text-muted-foreground">
              Public URL:{" "}
              <span className="font-medium text-foreground">
                /schools/{institutionSlug}
              </span>
            </div>
            <Link
              href="/dashboard/settings?tab=academic"
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Configure visitor visibility
            </Link>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/90 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Role Scope Matrix</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Live count of active users by dashboard scope.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full bg-muted px-2 py-0.5">
                Admin {roleMix.admins}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5">
                Principal {roleMix.principals}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5">
                Teacher {roleMix.teachers}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5">
                Student {roleMix.students}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5">
                Parent {roleMix.parents}
              </span>
            </div>
          </article>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/settings?tab=profile"
            className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Institution
            Profile
          </Link>
          <Link
            href="/dashboard/settings?tab=academic"
            className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            <FileSignature className="h-3.5 w-3.5 text-primary" /> Principal
            Signature
          </Link>
          <Link
            href="/dashboard/settings?tab=access"
            className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            <Users2 className="h-3.5 w-3.5 text-primary" /> Tenant Access Queue
          </Link>
        </div>
      </div>
    </section>
  );
}
