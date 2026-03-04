import { testimonialItems } from "@/components/landing/landing-data";

export function Testimonials() {
  return (
    <section
      id="field-notes"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
          Field Notes
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          মাঠপর্যায়ের অভিজ্ঞতা
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700">
          পাইলট বাস্তবায়নে বিদ্যালয় ও শিক্ষা প্রশাসনের মতামত।
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonialItems.map((item) => (
          <figure
            key={item.author}
            className="flex h-full flex-col rounded-xl border border-[#006a4e]/15 bg-white p-5 shadow-sm"
          >
            <blockquote className="flex-1 text-sm leading-relaxed text-slate-800">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-[#006a4e]/10 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006a4e]/10 text-xs font-bold text-[#006a4e]">
                {item.author.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {item.author}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-600">
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
