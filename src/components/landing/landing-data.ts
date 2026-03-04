import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck2,
  CreditCard,
  FileText,
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
    title: "উপস্থিতি রেজিস্টার ও প্রিন্ট",
    description:
      "দৈনিক উপস্থিতি নথিভুক্ত করে A4 ফরম্যাটে রেজিস্টার প্রিন্ট করুন।",
    icon: CalendarCheck2,
  },
  {
    title: "ফি ব্যবস্থাপনা ও সরকারি রশিদ",
    description:
      "মাসিক ফি, ভর্তি ও পরীক্ষা ফি ট্র্যাকিংসহ রশিদ ইস্যু ও প্রিন্ট।",
    icon: CreditCard,
  },
  {
    title: "শিক্ষার্থী প্রোফাইল ও অভিভাবক তথ্য",
    description:
      "NID/যোগাযোগসহ প্রাথমিক বিদ্যালয় অফিস-উপযোগী তথ্য কাঠামো।",
    icon: Users,
  },
  {
    title: "১ম–৫ম শ্রেণির একীভূত ব্যবস্থাপনা",
    description: "ক্লাস রুটিন, মূল্যায়ন ও রিপোর্ট শিট একটি ধারাবাহিক workflow-এ।",
    icon: BookOpen,
  },
  {
    title: "নোটিশ, ফলাফল ও এসএমএস যোগাযোগ",
    description: "বিদ্যালয় নোটিশ ও গুরুত্বপূর্ণ আপডেট দ্রুত অভিভাবকের কাছে পাঠান।",
    icon: MessageSquareText,
  },
  {
    title: "নিরাপদ, নিরীক্ষা-উপযোগী প্রশাসন",
    description: "রোলভিত্তিক অনুমতি, কার্যক্রম লগ এবং দাপ্তরিক স্বচ্ছতা নিশ্চিত।",
    icon: ShieldCheck,
  },
];

export const roleHighlights = [
  {
    role: "প্রধান শিক্ষক",
    outcome: "বিদ্যালয়ের সার্বিক উপস্থিতি, ফলাফল এবং প্রশাসনিক অগ্রগতি মনিটরিং।",
  },
  {
    role: "অফিস সহকারী",
    outcome: "ভর্তি, রেজিস্টার ও অফিস নথি সরকারি ফরম্যাটে দ্রুত সম্পন্ন।",
  },
  {
    role: "হিসাব শাখা",
    outcome: "ফি সংগ্রহ, বকেয়া ট্র্যাকিং ও রশিদ প্রিন্টিং একসাথে পরিচালনা।",
  },
  {
    role: "উপজেলা/জেলা প্রশাসন",
    outcome: "একাধিক বিদ্যালয়ের অগ্রগতি, উপস্থিতি ও আর্থিক রিপোর্ট পর্যবেক্ষণ।",
  },
];

export const trustStats = [
  { label: "জাতীয় কারিকুলাম সাপোর্ট", value: "শ্রেণি ১-৫" },
  { label: "দাপ্তরিক নথি প্রিন্ট", value: "A4 রেডি" },
  { label: "ডাটা নিরাপত্তা", value: "Role Based" },
  { label: "রোলআউট সক্ষমতা", value: "বিদ্যালয়-উপজেলা-জেলা" },
];

export const pricingTiers = [
  {
    name: "Pilot বিদ্যালয়",
    price: "BDT 0",
    cadence: "৬০ দিনের বাস্তবায়ন",
    cta: "পাইলট শুরু করুন",
    href: "/#demo-booking",
    features: [
      "১-৫ শ্রেণির পূর্ণ workflow",
      "উপস্থিতি ও রেজিস্টার প্রিন্ট",
      "ফি ও রশিদ মডিউল",
    ],
    highlighted: true,
  },
  {
    name: "উপজেলা ক্লাস্টার",
    price: "BDT 25,000",
    cadence: "প্রতি মাস (৫ বিদ্যালয় পর্যন্ত)",
    cta: "প্রস্তাব দেখুন",
    href: "/auth/register",
    features: [
      "একাধিক বিদ্যালয় ড্যাশবোর্ড",
      "প্রশিক্ষণ ও অনবোর্ডিং সহায়তা",
      "প্রাধান্যভিত্তিক সাপোর্ট",
    ],
    highlighted: false,
  },
  {
    name: "জেলা রোলআউট",
    price: "Custom",
    cadence: "বার্ষিক চুক্তি",
    cta: "যোগাযোগ করুন",
    href: "/auth/register",
    features: [
      "জেলা পর্যায়ে কেন্দ্রীভূত রিপোর্টিং",
      "অনসাইট বাস্তবায়ন ও প্রশিক্ষণ",
      "ডেডিকেটেড টেকনিক্যাল সহায়তা",
    ],
    highlighted: false,
  },
];

export const testimonialItems = [
  {
    quote:
      "অফিস কাগজপত্র থেকে উপস্থিতি রেজিস্টার পর্যন্ত সবকিছু এখন একই প্ল্যাটফর্মে সম্পন্ন হয়।",
    author: "মোছাঃ রাশেদা বেগম",
    role: "প্রধান শিক্ষক, সরকারি প্রাথমিক বিদ্যালয়",
  },
  {
    quote:
      "হিসাব শাখায় ফি ও রশিদ ব্যবস্থাপনা দ্রুত হওয়ায় অভিভাবক সেবার মান স্পষ্টভাবে বেড়েছে।",
    author: "মোঃ আব্দুল কাদের",
    role: "হিসাব সহকারী",
  },
  {
    quote:
      "উপজেলা পর্যায়ের পর্যবেক্ষণে বিদ্যালয়ভিত্তিক অগ্রগতি রিপোর্ট পাওয়া এখন অনেক সহজ।",
    author: "শারমিন আক্তার",
    role: "সহকারী উপজেলা শিক্ষা কর্মকর্তা",
  },
];

export const heroHighlights = [
  {
    label: "Ministry Alignment",
    value: "Primary Education Workflow",
    icon: CalendarCheck2,
  },
  {
    label: "Administration",
    value: "Admission + Attendance + Fees",
    icon: CreditCard,
  },
  {
    label: "Reporting",
    value: "Print-ready Result & Registers",
    icon: FileText,
  },
  {
    label: "Scale",
    value: "School to District",
    icon: Building2,
  },
  {
    label: "Insight",
    value: "Realtime Progress Overview",
    icon: BarChart3,
  },
  {
    label: "Security",
    value: "Role-based and Audit-ready",
    icon: ShieldCheck,
  },
  {
    label: "Users",
    value: "Teacher, Office, Accounts",
    icon: Users,
  },
];
