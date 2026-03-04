import Link from "next/link";

import { GovtMonogram } from "@/components/landing/govt-monogram";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-[#006a4e]/20 bg-[#006a4e] p-7 text-white shadow-[0_12px_28px_rgba(0,0,0,0.14)] sm:p-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#da291c]/35" />
        <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
              Next Step
            </p>
            <h2 className="text-2xl font-extrabold leading-tight sm:text-4xl">
              মন্ত্রণালয় ও বিদ্যালয় পর্যায়ে দ্রুত বাস্তবায়ন শুরু করুন
            </h2>
            <p className="text-sm leading-relaxed text-white/85 sm:text-base">
              নির্ধারিত ডেমো সেশনে আপনার বিদ্যালয়ের workflow যাচাই করে পাইলট
              বাস্তবায়ন পরিকল্পনা প্রস্তুত করা হবে।
            </p>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-3">
              <GovtMonogram className="h-10 w-10 border-white/35 bg-white/90" />
              <div>
                <p className="text-sm font-bold">Official Rollout Desk</p>
                <p className="text-xs text-white/75">
                  Primary Education Program
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-10 rounded-md bg-white px-4 text-sm font-bold text-[#006a4e] hover:bg-white/90"
              >
                <Link href="/#demo-booking" prefetch={false}>
                  ডেমো বুক করুন
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-md border-white/45 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/auth/register" prefetch={false}>
                  রেজিস্ট্রেশন
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
