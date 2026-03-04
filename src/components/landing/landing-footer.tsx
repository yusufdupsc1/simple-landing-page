import Link from "next/link";
import { GovtMonogram } from "@/components/landing/govt-monogram";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#006a4e]/15 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GovtMonogram className="h-12 w-12" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#006a4e]">
                  Government Service
                </p>
                <p className="text-base font-bold text-slate-900">
                  প্রাথমিক শিক্ষা ডিজিটাল প্ল্যাটফর্ম
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-700">
              Ministry-aligned এই প্ল্যাটফর্ম সরকারি প্রাথমিক বিদ্যালয়ের
              প্রশাসনিক কাজকে দ্রুত, স্বচ্ছ ও সুশৃঙ্খল করে।
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-900">প্রয়োজনীয় লিংক</p>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Admin Login", href: "/auth/login" },
                { label: "Demo Booking", href: "/#demo-booking" },
              ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch={false}
                className="text-slate-700 transition-colors hover:text-[#006a4e]"
              >
                {link.label}
              </Link>
            ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-900">যোগাযোগ</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Implementation Desk: +880 1700-000000</li>
              <li>Email: support@dhadash.com</li>
              <li>ঢাকা, বাংলাদেশ</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[#006a4e]/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs font-medium text-slate-600">
            © {new Date().getFullYear()} Dhadash. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#006a4e]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#da291c]" />
            Bangladesh Primary Education Digital Vision
          </div>
        </div>
      </div>
    </footer>
  );
}
