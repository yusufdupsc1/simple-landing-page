"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function CTASection() {
  const { t } = useT();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-[var(--radius-card)] bg-brand-600 p-6 text-white sm:p-10">
        <h2 className="text-2xl font-bold sm:text-3xl">Govt Primary স্কুলকে ডিজিটাল workflow-এ নিন</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
          প্রথমে attendance register + fee receipt print flow setup করুন, তারপর পুরো অফিস process সহজ করুন।
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-white text-brand-600 hover:bg-white/90">
            <Link href="/#demo-booking" prefetch={false}>
              {t("demo_cta")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/auth/register" prefetch={false}>
              {t("start_now")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
