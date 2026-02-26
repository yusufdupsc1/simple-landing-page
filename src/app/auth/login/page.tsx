// src/app/auth/login/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — ScholaOPS",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-card border-r border-border flex-col justify-between p-12 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Amber glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">ScholaOPS</span>
          </div>

          <blockquote className="space-y-3">
            <p className="text-3xl font-semibold leading-snug tracking-tight text-balance">
              &ldquo;The modern operating system for institutions that care about outcomes.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">
              Built for principals, teachers, and administrators
            </footer>
          </blockquote>
        </div>

        {/* Feature list */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: "⚡", label: "Real-time attendance" },
            { icon: "📊", label: "Analytics dashboard" },
            { icon: "💳", label: "Fee management" },
            { icon: "🎓", label: "Grade tracking" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50"
            >
              <span className="text-base">{f.icon}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ScholaOPS</span>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your institution account
            </p>
          </div>

          <LoginForm
            callbackUrl={params.callbackUrl}
            error={params.error}
          />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New school?{" "}
            <a
              href="/auth/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create your institution
            </a>
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
