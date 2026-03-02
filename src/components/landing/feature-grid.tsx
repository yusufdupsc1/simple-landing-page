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
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h2 className="text-2xl font-bold text-text sm:text-3xl">{t("landing_features_title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-text sm:text-base">
        {t("landing_features_description")}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureItems.map((item) => (
          <article
            key={item.title}
            className="group rounded-[var(--radius-card)] border border-ui-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5"
          >
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-semibold text-text">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-text">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
