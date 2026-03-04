import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { GovtMonogram } from "@/components/landing/govt-monogram";
import { heroHighlights } from "@/components/landing/landing-data";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <div className="absolute inset-x-4 top-0 -z-10 h-full rounded-[32px] bg-[linear-gradient(180deg,rgba(0,106,78,0.06),rgba(255,255,255,0))]" />

      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#006a4e]/20 bg-[#006a4e]/10 px-4 py-1.5 text-xs font-semibold text-[#006a4e]">
            <span className="h-2 w-2 rounded-full bg-[#da291c]" />
            National Primary Education Digital Service
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            প্রাথমিক শিক্ষা মন্ত্রণালয়ের জন্য
            <span className="block text-[#006a4e]">
              অফিসিয়াল ডিজিটাল ল্যান্ডিং অভিজ্ঞতা
            </span>
          </h1>

          <p className="max-w-2xl text-pretty text-base leading-relaxed text-slate-700 sm:text-lg">
            সরকারি প্রাথমিক বিদ্যালয়ের (শ্রেণি ১-৫) উপস্থিতি, ফি, ফলাফল,
            নোটিশ এবং দাপ্তরিক রিপোর্ট ব্যবস্থাপনায় একটি দ্রুত, নির্ভরযোগ্য ও
            প্রফেশনাল প্ল্যাটফর্ম।
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "বাংলাদেশ সরকার উপযোগী ডিজাইন সিস্টেম",
              "রেজিস্টার, রশিদ ও রিপোর্ট প্রিন্ট রেডি",
              "জেলা-উপজেলা পর্যায়ে স্কেলযোগ্য আর্কিটেকচার",
              "লো-ল্যাটেন্সি, লো-ট্রেনিং ইউএক্স",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-lg border border-[#006a4e]/15 bg-white px-3 py-2.5 text-sm text-slate-700"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#006a4e]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              asChild
              className="primary-cta h-12 rounded-md px-6 text-sm font-bold sm:text-base"
            >
              <Link href="/#demo-booking" prefetch={false}>
                ডেমো বুকিং দিন
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-md border-[#006a4e]/30 bg-white px-6 text-sm font-bold text-[#006a4e] hover:bg-[#006a4e]/5 sm:text-base"
            >
              <Link href="/auth/register" prefetch={false}>
                সিস্টেম চালু করুন
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute right-4 top-4 z-10 hidden rounded-full bg-white/90 p-2 shadow-sm sm:block">
            <GovtMonogram className="h-14 w-14" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#006a4e]/20 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-2 border-b border-[#006a4e]/10 bg-[#f3faf7] text-[11px] font-semibold text-slate-700">
              <div className="border-r border-[#006a4e]/10 px-3 py-2">
                জাতীয় পর্যায় সমন্বিত রিপোর্টিং
              </div>
              <div className="px-3 py-2">সরকারি প্রাথমিক শিক্ষা সেল</div>
            </div>
            <div className="p-3 sm:p-4">
              <Image
                src="/images/hero-dashboard.svg"
                alt="সরকারি প্রাথমিক বিদ্যালয় ড্যাশবোর্ড প্রিভিউ"
                width={1200}
                height={800}
                priority
                className="h-auto w-full rounded-xl border border-[#006a4e]/10"
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#006a4e]/15 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-[#006a4e]" aria-hidden="true" />
              Government Service Readiness
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {heroHighlights.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg bg-[#f8fbfa] px-2.5 py-2"
                >
                  <item.icon className="h-4 w-4 text-[#006a4e]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <p className="truncate text-xs font-bold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
