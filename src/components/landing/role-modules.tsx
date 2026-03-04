import { Building2, Users } from "lucide-react";
import { roleHighlights } from "@/components/landing/landing-data";

export function RoleModules() {
  return (
    <section id="modules" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#006a4e]/15 bg-white shadow-sm">
        <div className="govt-slab-border grid gap-6 bg-[linear-gradient(180deg,rgba(0,106,78,0.06),rgba(255,255,255,0))] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
                Role Based Modules
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                সরকারি প্রাথমিক শিক্ষা প্রশাসনের দায়িত্বভিত্তিক মডিউল
            </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">
                প্রধান শিক্ষক, অফিস সহকারী, হিসাব শাখা এবং উপজেলা/জেলা
                প্রশাসনের জন্য আলাদা অপারেশনাল ভিউ, যাতে প্রতিটি স্তরে সিদ্ধান্ত
                দ্রুত ও নির্ভুল হয়।
            </p>
          </div>
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-[#006a4e]/20 bg-white px-3 py-2 text-xs font-semibold text-[#006a4e]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Multi-level Governance
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roleHighlights.map((item) => (
              <article
                key={item.role}
                className="rounded-xl border border-[#006a4e]/15 bg-white p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006a4e]/10 text-[#006a4e]">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                {item.role}
              </h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                {item.outcome}
              </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
