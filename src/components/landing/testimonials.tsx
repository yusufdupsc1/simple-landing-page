import { testimonialItems } from "@/components/landing/landing-data";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Pilot School Feedback
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          আমাদের ব্যবহারকারীদের অভিজ্ঞতা ও মতামত।
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonialItems.map((item, i) => (
          <figure
            key={item.author}
            className="glass-card p-8 rounded-3xl premium-shadow flex flex-col transition-premium hover:-translate-y-1"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <blockquote className="text-sm leading-relaxed text-foreground/90 italic flex-1">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 pt-4 border-t border-border/40 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {item.author.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {item.author}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground truncate">
                  {item.role}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
