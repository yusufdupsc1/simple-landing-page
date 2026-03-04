import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-card/60 backdrop-blur-xl transition-premium py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                Dhadash
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              ডিজিটাল বাংলাদেশ ভিশনে সরকারি প্রাথমিক বিদ্যালয়ের অটোমেশন
              পার্টনার।
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold"
            aria-label="Footer"
          >
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Portal Login", href: "/auth/login" },
              { label: "Contact Admin", href: "mailto:admin@dhadash.com" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch={false}
                className="text-muted-foreground transition-premium hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            © {new Date().getFullYear()} Dhadash. All rights reserved. Built
            with ❤️ for Bangladesh.
          </p>
          <div className="flex items-center gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* National Emblem Shape Simulated */}
            <div className="h-6 w-6 monument-motif bg-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              Digital Bangladesh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
