"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function CTASection() {
  const { t } = useT();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl flag-gradient p-8 text-white sm:p-16 premium-shadow">
        {/* Subtle Ornament Background */}
        <div className="absolute right-[-10%] top-[-10%] h-64 w-64 monument-motif bg-white/10 rotate-12 blur-sm pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-extrabold sm:text-5xl leading-tight tracking-tight max-w-2xl">
            Govt Primary স্কুলকে ডিজিটাল workflow-এ নিন
          </h2>
          <p className="max-w-xl text-base text-white/80 sm:text-lg leading-relaxed">
            প্রথমে attendance register + fee receipt print flow setup করুন,
            তারপর পুরো অফিস process সহজ করুন।
          </p>
          <div className="pt-6 flex flex-wrap gap-4">
            <Button
              asChild
              className="h-14 px-8 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold transition-premium active:scale-95 shadow-xl shadow-black/10"
            >
              <Link href="/#demo-booking" prefetch={false}>
                {t("demo_cta")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 rounded-2xl border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-bold transition-premium active:scale-95"
            >
              <Link href="/auth/register" prefetch={false}>
                {t("start_now")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
