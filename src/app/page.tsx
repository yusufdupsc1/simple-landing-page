import Link from "next/link";
import { ArrowRight, GraduationCap, Users, BookOpen, BarChart3, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 view-transition">
      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ScholasticOS</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Button asChild className="rounded-full shadow-sm">
                <Link href="/dashboard">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full shadow-sm">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              ScholasticOS 2.0 is now live
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter max-w-4xl text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              The invisible operating system for modern schools
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl text-balance">
              Admissions, academics, finance, and communication seamlessly integrated into one premium, zero-friction platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button asChild size="lg" className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
                <Link href={session ? "/dashboard" : "/auth/register"}>
                  Explore the Platform
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="rounded-full h-12 px-8 text-base hover:bg-muted/50">
                <Link href="/auth/login">
                  Access Portal
                </Link>
              </Button>
            </div>
          </div>

          {/* Bento Grid Features */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 hover:border-border transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Users className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Unified Directory</h3>
              <p className="text-muted-foreground text-balance">
                Manage students, parents, and academic staff through a single, lightning-fast interface with intelligent relationship mapping.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 hover:border-border transition-colors">
              <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <BarChart3 className="w-10 h-10 text-amber-500 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Financial Engine</h3>
              <p className="text-muted-foreground text-balance">
                Automated invoicing, payment tracking, and real-time revenue analytics.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 hover:border-border transition-colors">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <BookOpen className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Academic Core</h3>
              <p className="text-muted-foreground text-balance">
                Gradebooks, schedules, and attendance built for cognitive ease.
              </p>
            </div>

            <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 hover:border-border transition-colors">
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShieldCheck className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Enterprise Grade Security</h3>
              <p className="text-muted-foreground text-balance">
                Role-based access control, cryptographic session management, and continuous audit logging keeping your data sovereign and secure.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 mt-auto bg-muted/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ScholasticOS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
