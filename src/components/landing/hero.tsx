"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { heroHighlights } from "@/components/landing/landing-data";
import { useT } from "@/lib/i18n/client";

export function Hero() {
  const { t } = useT();

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-18">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-info-bg bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-info-fg">
            {t("landing_badge")}
          </p>
          <h1 className="max-w-xl text-balance text-4xl font-bold leading-tight text-text sm:text-5xl lg:text-6xl">
            {t("landing_hero_title")}
          </h1>
          <p className="max-w-xl text-pretty text-base text-muted-text sm:text-lg">
            {t("landing_hero_description")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="primary-cta rounded-full px-6">
              <Link href="/#demo-booking" prefetch={false}>
                {t("demo_cta")}
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-ui-border px-6">
              <Link href="/auth/register" prefetch={false}>
                {t("start_now")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-ui-border bg-surface shadow-card">
            <Image
              src="/images/hero-dashboard.svg"
              alt="Dhadash dashboard preview"
              width={1200}
              height={800}
              priority
              className="h-auto w-full"
            />
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-ui-border bg-surface p-3"
              >
                <item.icon className="mb-2 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold text-text">{item.label}</p>
                <p className="text-xs text-muted-text">{item.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
