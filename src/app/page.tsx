import Link from "next/link";
import { ArrowRight, Sparkles, Users, BookOpen, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden">
      {/* Background Effects (Fast loading CSS) */}
      <div className="absolute inset-0 noise pointer-events-none opacity-50 mix-blend-overlay z-0" />
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-0" />

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white animate-pulse-slow" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              ScholaOPS
            </span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Button asChild className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-primary/90 hover:bg-primary">
                <Link href="/dashboard">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex rounded-full px-6 hover:bg-muted/50 transition-colors duration-300">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full shadow-sm hover:shadow-primary/25 hover:shadow-lg transition-all duration-300 bg-primary/95 hover:bg-primary px-6">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-36 pb-20 px-6 z-10 relative flex flex-col items-center justify-center min-h-[85vh]">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-8 stagger">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-medium border border-primary/10 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              ScholaOPS v1.0 is now live
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter max-w-5xl text-balance leading-[1.1]">
              The operations <br className="hidden sm:block" />
              <span className="gradient-text">standard of excellence</span> <br className="hidden sm:block" />
              for modern schools
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground/90 max-w-2xl text-balance leading-relaxed">
              Admissions, academics, finance, and communication—seamlessly integrated into one premium, zero-friction platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
              <Button asChild size="lg" className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                <Link href={session ? "/dashboard" : "/auth/register"}>
                  Explore the Platform <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="rounded-full h-14 px-8 text-base border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/50 hover:border-border transition-all duration-300">
                <Link href="/auth/login">
                  Access Portal
                </Link>
              </Button>
            </div>

            <div className="pt-12 flex items-center gap-8 text-muted-foreground/60 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> Lightning fast
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Enterprise secure
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bento Grid Features */}
      <section className="relative z-10 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            <div className="md:col-span-2 group glass rounded-3xl p-8 hover:border-border/80 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 tracking-tight">Unified Directory</h3>
                <p className="text-muted-foreground text-balance leading-relaxed">
                  Manage students, parents, and academic staff through a single, lightning-fast interface with intelligent relationship mapping and deeply integrated profiles.
                </p>
              </div>
            </div>

            <div className="group glass rounded-3xl p-8 hover:border-border/80 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 tracking-tight">Financial Engine</h3>
                <p className="text-muted-foreground text-balance leading-relaxed">
                  Automated invoicing, payment tracking, and real-time revenue analytics.
                </p>
              </div>
            </div>

            <div className="group glass rounded-3xl p-8 hover:border-border/80 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 tracking-tight">Academic Core</h3>
                <p className="text-muted-foreground text-balance leading-relaxed">
                  Gradebooks, schedules, and attendance built strictly for cognitive ease.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 group glass rounded-3xl p-8 hover:border-border/80 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 tracking-tight">Enterprise Grade Security</h3>
                <p className="text-muted-foreground text-balance leading-relaxed">
                  Role-based access control, cryptographic session management, and continuous audit logging keeping your data sovereign, compliant, and deeply secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-background/40 relative z-10 backdrop-blur-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm text-muted-foreground/80">
          <p className="font-medium">© {new Date().getFullYear()} ScholaOPS. Excellence in Operations.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="https://github.com/scholaops" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

