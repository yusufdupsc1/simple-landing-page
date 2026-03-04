import { featureItems } from "@/components/landing/landing-data";

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
          Core Services
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          সরকারি প্রাথমিক বিদ্যালয়ের জন্য প্রয়োজনীয় ডিজিটাল ফিচারসমূহ
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
          মাঠপর্যায়ের প্রশাসনিক বাস্তবতা ও মন্ত্রণালয় পর্যায়ের রিপোর্টিং চাহিদা
          মাথায় রেখে প্রতিটি মডিউল ডিজাইন করা হয়েছে।
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featureItems.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-[#006a4e]/15 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#006a4e]/10 text-[#006a4e]">
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
