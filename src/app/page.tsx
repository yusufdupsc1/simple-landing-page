import type { Metadata } from "next";

import { CTASection } from "@/components/landing/cta-section";
import { DemoBookingForm } from "@/components/landing/demo-booking-form";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { RoleModules } from "@/components/landing/role-modules";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustStrip } from "@/components/landing/trust-strip";

export const metadata: Metadata = {
  title: "Dhadash — Govt. Primary School Operations",
  description:
    "সরকারি প্রাথমিক বিদ্যালয় (১ম–৫ম শ্রেণি) এর জন্য attendance, fee, notice এবং print workflow.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <LandingHeader />
      <main>
        <Hero />
        <DemoBookingForm />
        <TrustStrip />
        <RoleModules />
        <FeatureGrid />
        <PricingPlans />
        <Testimonials />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
