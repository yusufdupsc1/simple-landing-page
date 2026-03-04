import { trustStats } from "@/components/landing/landing-data";

export function TrustStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <div className="rounded-2xl border border-[#006a4e]/15 bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-4 text-sm font-semibold text-slate-700">
          জাতীয় প্রাথমিক শিক্ষা ডিজিটাল সেবার মূল সক্ষমতাসমূহ
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-[#006a4e]/10 bg-[#f8fbfa] px-3 py-3"
            >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold text-[#006a4e] sm:text-xl">
              {stat.value}
            </p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
