import { Users } from "lucide-react";
import { roleHighlights } from "@/components/landing/landing-data";

export function RoleModules() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
      <div className="glass-card rounded-3xl p-8 sm:p-10 premium-shadow border-primary/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Govt Primary Office Roles অনুযায়ী
            </h2>
            <p className="max-w-xl text-base text-muted-foreground leading-relaxed">
              Head Teacher, Office Staff, Accounts—প্রতিটি ভূমিকার জন্য
              কাজভিত্তিক view।
            </p>
          </div>
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roleHighlights.map((item, i) => (
            <div
              key={item.role}
              className="group p-6 rounded-2xl bg-background/40 border border-border/40 hover:border-primary/30 transition-premium hover:bg-background/60"
            >
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {item.role}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.outcome}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
