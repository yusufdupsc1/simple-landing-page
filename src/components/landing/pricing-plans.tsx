import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pricingTiers } from "@/components/landing/landing-data";

export function PricingPlans() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Simple Govt Primary Pricing
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          Pilot দিয়ে শুরু করুন, ব্যবহার প্রমাণ হলে স্কুল-লেভেল rollout করুন।
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <article
            key={tier.name}
            className={[
              "relative glass-card p-8 rounded-3xl premium-shadow flex flex-col transition-premium hover:-translate-y-1",
              tier.highlighted
                ? "border-primary/40 ring-1 ring-primary/20 bg-primary/[0.03]"
                : "border-border/40 bg-card/40",
            ].join(" ")}
          >
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                Recommended
              </div>
            )}

            <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <p className="text-4xl font-extrabold tabular-nums text-foreground">
                {tier.price}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {tier.cadence}
              </p>
            </div>

            <div className="mt-8 space-y-4 flex-1">
              {tier.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-sm text-foreground/80 leading-snug"
                >
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button
              asChild
              className={[
                "mt-8 w-full h-12 rounded-2xl font-bold transition-premium active:scale-95 shadow-md",
                tier.highlighted
                  ? "primary-cta"
                  : "bg-card/80 border-border/60 hover:bg-muted",
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
