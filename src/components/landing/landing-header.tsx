"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function LandingHeader() {
  const { t } = useT();

  return (
    <header className="safe-top sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl transition-premium">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-premium"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_2px_10px_-3px_rgba(var(--primary),0.5)] transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 leading-none">
              Dhadash
            </span>
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase opacity-70 leading-none mt-1">
              National Ops
            </span>
          </div>
        </Link>

        <nav
          aria-label="Marketing"
          className="hidden items-center gap-8 md:flex"
        >
          {["ফিচার", "প্ল্যান", "মতামত"].map((item, i) => (
            <a
              key={i}
              href={`#${["features", "pricing", "testimonials"][i]}`}
              className="text-sm font-medium text-muted-foreground transition-premium hover:text-primary relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden xs:block">
            <LanguageToggle />
          </div>
          <Link
            href="/auth/login"
            prefetch={false}
            className="hidden sm:inline-flex text-sm font-bold text-muted-foreground hover:text-foreground transition-premium px-3"
          >
            লগইন
          </Link>
          <Button
            asChild
            className="primary-cta group rounded-xl px-6 font-bold shadow-sm transition-premium active:scale-95"
          >
            <Link href="/#demo-booking" prefetch={false}>
              {t("demo_cta")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
