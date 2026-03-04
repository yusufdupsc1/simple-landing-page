import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the legal terms and conditions for using the Dhadash platform.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Standard terms of service for the Dhadash platform.
      </p>
    </main>
  );
}
