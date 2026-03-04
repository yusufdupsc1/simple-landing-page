import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pricingTiers } from "@/components/landing/landing-data";

export function PricingPlans() {
  return (
    <section
      id="plans"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
          Rollout Models
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          বাস্তবায়ন ও সহায়তা পরিকল্পনা
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
          বিদ্যালয় থেকে জেলা পর্যায় পর্যন্ত ধাপে ধাপে বাস্তবায়নের জন্য পরিকল্পিত
          সাপোর্ট কাঠামো।
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <article
            key={tier.name}
            className={[
              "relative flex flex-col rounded-xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              tier.highlighted
                ? "border-[#006a4e]/40 bg-[#f2f9f6]"
                : "border-[#006a4e]/15 bg-white",
            ].join(" ")}
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-5 rounded-full bg-[#da291c] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Recommended
              </div>
            )}

            <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <p className="text-3xl font-extrabold tabular-nums text-[#006a4e]">
                {tier.price}
              </p>
              <p className="text-sm font-medium text-slate-600">
                {tier.cadence}
              </p>
            </div>

            <div className="mt-6 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 text-sm leading-snug text-slate-700"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#006a4e]/10 text-[#006a4e]">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button
              asChild
              className={[
                "mt-7 h-11 w-full rounded-md text-sm font-bold",
                tier.highlighted
                  ? "primary-cta"
                  : "border-[#006a4e]/30 bg-white text-[#006a4e] hover:bg-[#006a4e]/5",
              ].join(" ")}
              variant={tier.highlighted ? "default" : "outline"}
            >
              <Link href={tier.href} prefetch={false}>
                {tier.cta}
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
