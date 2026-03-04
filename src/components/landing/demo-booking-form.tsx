"use client";

import { useState, useTransition } from "react";
import { CalendarDays, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <section
      id="demo-booking"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8"
    >
      <div className="rounded-2xl border border-[#006a4e]/15 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-4 border-b border-[#006a4e]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#006a4e]">
              Demo Request
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
              বিদ্যালয় ডেমো বুকিং ফর্ম
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              অফিস workflow, রেজিস্টার প্রিন্টিং ও রিপোর্টিং লাইভ ডেমো।
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f5faf8] px-3 py-2 text-xs font-semibold text-slate-700">
            <PhoneCall className="h-4 w-4 text-[#006a4e]" aria-hidden="true" />
            প্রয়োজন হলে কল: +880 1700-000000
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="demo-school" className="text-slate-800">
              বিদ্যালয়ের নাম *
            </Label>
            <Input
              id="demo-school"
              value={form.schoolName}
              onChange={(e) => set("schoolName", e.target.value)}
              className="border-[#006a4e]/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-contact" className="text-slate-800">
              দায়িত্বপ্রাপ্ত ব্যক্তির নাম *
            </Label>
            <Input
              id="demo-contact"
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              className="border-[#006a4e]/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-phone" className="text-slate-800">
              মোবাইল নম্বর *
            </Label>
            <Input
              id="demo-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="01XXXXXXXXX"
              className="border-[#006a4e]/20"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-date" className="text-slate-800">
              সম্ভাব্য ডেমো তারিখ (ঐচ্ছিক)
            </Label>
            <Input
              id="demo-date"
              type="date"
              value={form.preferredDate}
              onChange={(e) => set("preferredDate", e.target.value)}
              className="border-[#006a4e]/20"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="demo-note" className="text-slate-800">
              অতিরিক্ত তথ্য (ঐচ্ছিক)
            </Label>
            <Textarea
              id="demo-note"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="বিদ্যালয়ের বিশেষ প্রয়োজন বা বর্তমান চ্যালেঞ্জ লিখুন"
              className="min-h-[88px] border-[#006a4e]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button
              type="submit"
              disabled={pending}
              className="primary-cta h-11 w-full rounded-md px-5 text-sm font-bold sm:w-auto"
            >
              {pending ? "পাঠানো হচ্ছে..." : "ডেমো বুকিং পাঠান"}
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <CalendarDays className="h-4 w-4 text-[#006a4e]" aria-hidden="true" />
              অনুরোধ পাওয়ার ২৪ ঘণ্টার মধ্যে যোগাযোগ করা হবে।
            </div>
          </div>
        </form>

        <div aria-live="polite">
          {message ? (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
