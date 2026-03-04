// src/app/auth/login/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Landmark, ShieldCheck, School } from "lucide-react";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";
import { GovtMonogram } from "@/components/landing/govt-monogram";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministry Login — Primary Education Digital Platform",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const googleEnabled = true;

  return (
    <main className="min-h-screen bg-background">
      <div className="govt-top-band">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-1.5 text-[11px] font-semibold text-white sm:px-8">
          <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
          <span className="hidden sm:inline">
            Ministry of Primary and Mass Education
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
          <section className="rounded-2xl border border-[#006a4e]/15 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#006a4e]/20 bg-[#006a4e]/10 px-3 py-1 text-xs font-semibold text-[#006a4e]">
              <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
              Official Government Authority
            </div>

            <h1 className="text-balance text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              প্রাথমিক শিক্ষা মন্ত্রণালয়ের অধীন
              <span className="block text-[#006a4e]">
                স্কুল ম্যানেজমেন্ট সিস্টেম অ্যাডমিন লগইন
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
              এই সিস্টেমের মালিকানা, কর্তৃত্ব এবং নীতিগত নিয়ন্ত্রণ Ministry of
              Primary and Mass Education, Government of Bangladesh-এর অধীনে
              পরিচালিত।
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Ministry Controlled",
                "Password + OTP Login",
                "Audit-ready Access",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#006a4e]/20 bg-[#f3faf7] px-2.5 py-1 text-[11px] font-semibold text-[#006a4e]"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Official Governance",
                  text: "মন্ত্রণালয়-অধিভুক্ত নীতিমালা অনুসারে অপারেশন",
                  icon: Building2,
                },
                {
                  title: "School Operations",
                  text: "উপস্থিতি, ফি, রেজিস্টার ও রিপোর্ট ব্যবস্থাপনা",
                  icon: School,
                },
                {
                  title: "Security Controls",
                  text: "রোলভিত্তিক অ্যাক্সেস ও যাচাইকৃত প্রবেশাধিকার",
                  icon: ShieldCheck,
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-[#006a4e]/15 bg-[#f8fbfa] p-4"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#006a4e]/10 text-[#006a4e]">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[#da291c]/25 bg-[#fff7f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#da291c]">
                Ownership & Authority
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Ministry of Primary and Mass Education
              </p>
              <p className="text-sm text-slate-700">
                Government of the People&apos;s Republic of Bangladesh
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#006a4e]/15 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <GovtMonogram className="h-12 w-12" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
                  Secure Access
                </p>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Welcome back
                </h2>
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-700">
              Ministry Authorized Login: অনুমোদিত প্রশাসনিক অ্যাকাউন্ট দিয়ে
              সাইন ইন করুন।
            </p>

            <LoginForm
              callbackUrl={params.callbackUrl}
              error={params.error}
              googleEnabled={googleEnabled}
            />

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New school?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create your institution
              </Link>
            </p>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </p>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              Operational authority remains under Ministry governance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
