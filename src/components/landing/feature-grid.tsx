"use client";

import { CreditCard, FileText, MessageSquareText } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function FeatureGrid() {
  const { t } = useT();

  const featureItems = [
    {
      title: t("landing_feature_fee_receipt_title"),
      description: t("landing_feature_fee_receipt_description"),
      icon: CreditCard,
    },
    {
      title: t("landing_feature_report_card_title"),
      description: t("landing_feature_report_card_description"),
      icon: FileText,
    },
    {
      title: t("landing_feature_sms_notice_title"),
      description: t("landing_feature_sms_notice_description"),
      icon: MessageSquareText,
    },
  ];

  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("landing_features_title")}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          {t("landing_features_description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureItems.map((item, i) => (
          <article
            key={item.title}
            className="glass-card p-6 rounded-2xl premium-shadow group hover-glow"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground/90">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
