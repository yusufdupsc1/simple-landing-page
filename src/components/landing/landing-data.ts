import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CreditCard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

export type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const featureItems: FeatureItem[] = [
  {
    title: "উপস্থিতি রেজিস্টার + প্রিন্ট",
    description:
      "দৈনিক উপস্থিতি নিন, এক ক্লিকে A4 রেজিস্টার প্রিন্ট করুন।",
    icon: CalendarCheck2,
  },
  {
    title: "মাসিক ফি ও রশিদ",
    description:
      "মাসিক ফি, ভর্তি ফি, পরীক্ষা ফি থেকে দ্রুত বিল তৈরি ও রশিদ প্রিন্টিং।",
    icon: CreditCard,
  },
  {
    title: "Guardian-ready Profiles",
    description:
      "Father/Mother/Guardian Phone সহ সরকারি প্রাথমিক অফিস উপযোগী তথ্য কাঠামো।",
    icon: Users,
  },
  {
    title: "Class 1-5 Focus",
    description:
      "শুধু ১ম–৫ম শ্রেণির workflow; জটিলতা ছাড়াই দ্রুত adoption.",
    icon: BookOpen,
  },
  {
    title: "SMS নোটিশ",
    description:
      "স্কুল নোটিশ দ্রুত parent/guardian communication-ready flow.",
    icon: MessageSquareText,
  },
  {
    title: "Secure & Audit-ready",
    description:
      "Role-based access এবং ট্র্যাকযোগ্য action history.",
    icon: ShieldCheck,
  },
];

export const roleHighlights = [
  {
    role: "Head Teacher",
    outcome: "Attendance summary + print-ready register in minutes.",
  },
  {
    role: "Office Staff",
    outcome: "Student admission data entry with govt primary format.",
  },
  {
    role: "Accounts",
    outcome: "Preset fee setup, payment record, and receipt print without complexity.",
  },
];

export const trustStats = [
  { label: "Attendance Register", value: "A4 Ready" },
  { label: "Fee Collection", value: "Receipt First" },
  { label: "Target Segment", value: "Govt Primary" },
];

export const pricingTiers = [
  {
    name: "Pilot",
    price: "BDT 0",
    cadence: "60-day pilot",
    cta: "ডেমো দেখুন",
    href: "/#demo-booking",
    features: ["Class 1-5 workflow", "Attendance + register print", "Fee + receipt print"],
    highlighted: true,
  },
  {
    name: "School",
    price: "BDT 5,000",
    cadence: "per month",
    cta: "শুরু করুন",
    href: "/auth/register",
    features: ["Full office operations", "Bangla-first interface", "Priority onboarding"],
    highlighted: false,
  },
  {
    name: "District Rollout",
    price: "Custom",
    cadence: "annual",
    cta: "Talk to team",
    href: "/auth/register",
    features: ["Multi-school rollout", "On-site training", "Dedicated support"],
    highlighted: false,
  },
];

export const testimonialItems = [
  {
    quote:
      "আমাদের অফিসে attendance register print workflow-টাই সবচেয়ে বড় সুবিধা দিয়েছে।",
    author: "Head Teacher, Pilot School",
    role: "Govt Primary",
  },
  {
    quote:
      "ফি রশিদ প্রিন্ট এখন দ্রুত হয়, staff training time অনেক কমেছে।",
    author: "Accounts Operator",
    role: "Govt Primary",
  },
  {
    quote:
      "Class 1-5 focused হওয়ায় unnecessary feature distraction নেই।",
    author: "Assistant Teacher",
    role: "Govt Primary",
  },
];

export const heroHighlights = [
  {
    label: "উপস্থিতি রেজিস্টার",
    value: "A4 প্রিন্ট রেডি",
    icon: CalendarCheck2,
  },
  {
    label: "মাসিক ফি ও রশিদ",
    value: "ক্যাশ + SSLCommerz",
    icon: CreditCard,
  },
  {
    label: "Govt Primary Scope",
    value: "Class 1-5 only",
    icon: Users,
  },
  {
    label: "SMS নোটিশ",
    value: "অভিভাবক যোগাযোগ রেডি",
    icon: MessageSquareText,
  },
  {
    label: "Office Simplicity",
    value: "Low training required",
    icon: BarChart3,
  },
];
