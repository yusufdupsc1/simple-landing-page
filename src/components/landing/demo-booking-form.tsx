"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DemoBookingState = {
  schoolName: string;
  contactName: string;
  phone: string;
  preferredDate: string;
  note: string;
};

const INITIAL_STATE: DemoBookingState = {
  schoolName: "",
  contactName: "",
  phone: "",
  preferredDate: "",
  note: "",
};

export function DemoBookingForm() {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<DemoBookingState>(INITIAL_STATE);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const set = (key: keyof DemoBookingState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/demo-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as { message?: string; error?: string };

        if (!res.ok) {
          setError(data.error || "ডেমো অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।");
          return;
        }

        setMessage(
          data.message ||
            "ডেমো অনুরোধ গ্রহণ করা হয়েছে। আমাদের টিম দ্রুত যোগাযোগ করবে।",
        );
        setForm(INITIAL_STATE);
      } catch {
        setError("নেটওয়ার্ক সমস্যার কারণে অনুরোধ পাঠানো যায়নি।");
      }
    });
  };

  return (
    <section id="demo-booking" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-lg border border-ui-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-bold text-text sm:text-2xl">ডেমো বুকিং ফর্ম</h2>
        <p className="mt-1 text-sm text-muted-text">
          আপনার স্কুলের জন্য ডেমো সেশন বুক করুন। ফি ও রশিদ প্রিন্টিং ফ্লো লাইভ দেখানো হবে।
        </p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="demo-school">স্কুলের নাম *</Label>
            <Input
              id="demo-school"
              value={form.schoolName}
              onChange={(e) => set("schoolName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-contact">যোগাযোগের নাম *</Label>
            <Input
              id="demo-contact"
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-phone">মোবাইল নম্বর *</Label>
            <Input
              id="demo-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-date">পছন্দের তারিখ (ঐচ্ছিক)</Label>
            <Input
              id="demo-date"
              type="date"
              value={form.preferredDate}
              onChange={(e) => set("preferredDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="demo-note">নোট (ঐচ্ছিক)</Label>
            <Input
              id="demo-note"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="আপনার স্কুলের বিশেষ চাহিদা লিখুন"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="primary-cta w-full sm:w-auto">
              {pending ? "পাঠানো হচ্ছে..." : "ডেমো বুকিং পাঠান"}
            </Button>
          </div>
        </form>

        {message ? (
          <p className="mt-3 text-sm font-medium text-green-700">{message}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}

