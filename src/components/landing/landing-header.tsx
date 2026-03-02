"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function LandingHeader() {
  const { t } = useT();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight sm:text-base">Dhadash</span>
        </Link>

        <nav aria-label="Marketing" className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            ফিচার
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            প্ল্যান
          </a>
          <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            মতামত
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login" prefetch={false}>
              লগইন
            </Link>
          </Button>
          <Button asChild className="primary-cta rounded-full px-5">
            <Link href="/#demo-booking" prefetch={false}>
              {t("demo_cta")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
