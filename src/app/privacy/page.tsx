import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Dhadash collects, uses, and protects school and student data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is the standard privacy policy for Dhadash, detailing how we
        protect your institution&apos;s data.
      </p>
    </main>
  );
}
