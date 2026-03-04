"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendarCheck2, CalendarDays, FileText, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function Hero() {
  const { t } = useT();
  const bulletItems = [
    { label: t("landing_bullet_attendance_print"), icon: CalendarCheck2 },
    { label: t("landing_bullet_routine_print"), icon: CalendarDays },
    { label: t("landing_bullet_result_sheet"), icon: FileText },
    { label: t("landing_bullet_notice_board"), icon: Bell },
  ];

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-20 sm:px-8 sm:pt-28 overflow-hidden">
      {/* Background Decorative Patterns */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-accent/3 blur-[100px] rounded-full" />

      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {t("landing_badge")}
            </p>
          </div>

          <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            {t("landing_hero_title")
              .split(" ")
              .map((word, i) =>
                i === 0 || i === 1 ? (
                  <span key={i} className="gradient-text">
                    {word}{" "}
                  </span>
                ) : (
                  word + " "
                ),
              )}
          </h1>

          <p className="max-w-lg text-pretty text-base text-muted-foreground sm:text-xl leading-relaxed">
            {t("landing_hero_description")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bulletItems.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/60 transition-premium group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button
              asChild
              className="primary-cta group rounded-2xl h-14 px-8 text-base font-bold shadow-lg shadow-primary/20 transition-premium active:scale-95"
            >
              <Link href="/#demo-booking" prefetch={false}>
                {t("demo_cta")}
                <ArrowRight
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl h-14 px-8 text-base font-bold border-border/60 bg-background/50 backdrop-blur-sm transition-premium hover:bg-muted active:scale-95"
            >
              <Link href="/auth/register" prefetch={false}>
                {t("start_now")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
          {/* Subtle National Motif Wrapper */}
          <div className="absolute -inset-4 -z-10 monument-motif bg-primary/5 opacity-50 blur-sm pointer-events-none" />

          <div className="relative glass-card rounded-3xl p-3 sm:p-4 premium-shadow overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/40">
              <Image
                src="/images/hero-dashboard.svg"
                alt="Dhadash dashboard preview"
                width={1200}
                height={800}
                priority
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Floating Action Card (Simulated Tooltip) */}
          <div className="absolute -bottom-6 -left-6 hidden sm:block glass-card p-4 rounded-2xl premium-shadow animate-bounce-slow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                  Live Attendance
                </p>
                <p className="text-sm font-bold text-foreground">
                  100% Secure & Automated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center justify-center text-center opacity-40">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent mb-4" />
        <p className="text-sm font-medium tracking-widest text-primary italic font-serif">
          &ldquo;আমার সোনার বাংলা, আমি তোমায় ভালোবাসি&rdquo;
        </p>
      </div>
    </section>
  );
}
