import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";
import { GovtMonogram } from "@/components/landing/govt-monogram";
import { getDefaultDashboardPath } from "@/lib/role-routing";

type LoginScope = "admin" | "teacher" | "student" | "parent" | "owner";

const SCOPE_META: Record<
  LoginScope,
  {
    title: string;
    subtitle: string;
    scope: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
    institutionSlug?: string;
  }
> = {
  admin: {
    title: "Admin Login",
    subtitle: "Tenant admin/principal/staff access",
    scope: "ADMIN",
  },
  teacher: {
    title: "Teacher Login",
    subtitle: "Teacher portal access",
    scope: "TEACHER",
  },
  student: {
    title: "Student Login",
    subtitle: "Student portal access",
    scope: "STUDENT",
  },
  parent: {
    title: "Parent Login",
    subtitle: "Parent portal access",
    scope: "PARENT",
  },
  owner: {
    title: "Owner Login",
    subtitle: "Ministry owner control access",
    scope: "ADMIN",
    institutionSlug: "mope-owner-control",
  },
};

export const metadata: Metadata = {
  title: "Tenant Login",
  robots: { index: false },
};

function normalizeScope(input: string): LoginScope | null {
  const value = input.trim().toLowerCase();
  if (value in SCOPE_META) return value as LoginScope;
  return null;
}

export default async function ScopedLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ scope: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string; institution?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const normalizedScope = normalizeScope(resolvedParams.scope);
  if (!normalizedScope) return notFound();

  const scopeMeta = SCOPE_META[normalizedScope];
  const session = await auth();
  const currentRole = (session?.user as { role?: string } | undefined)?.role;
  if (session) {
    redirect(getDefaultDashboardPath(currentRole));
  }

  const lockedInstitution =
    scopeMeta.institutionSlug ?? resolvedSearch.institution?.trim().toLowerCase();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-2xl border border-[#006a4e]/15 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <GovtMonogram className="h-12 w-12" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
                Tenant scoped access
              </p>
              <h1 className="text-lg font-extrabold text-slate-900">{scopeMeta.title}</h1>
              <p className="text-xs text-slate-600">{scopeMeta.subtitle}</p>
            </div>
          </div>

          <LoginForm
            callbackUrl={resolvedSearch.callbackUrl}
            error={resolvedSearch.error}
            googleEnabled={false}
            lockedScope={scopeMeta.scope}
            lockedInstitution={lockedInstitution}
          />

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Need another scope?{" "}
            <Link href="/auth/login/admin" className="underline underline-offset-4">
              Admin
            </Link>{" · "}
            <Link href="/auth/login/teacher" className="underline underline-offset-4">
              Teacher
            </Link>{" · "}
            <Link href="/auth/login/student" className="underline underline-offset-4">
              Student
            </Link>{" · "}
            <Link href="/auth/login/parent" className="underline underline-offset-4">
              Parent
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
