// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Hind_Siliguri } from "next/font/google";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import { TabLoadingIndicator } from "@/components/layout/tab-loading-indicator";
import { normalizeLocale } from "@/lib/i18n/getDict";

const geistSans = localFont({
  src: "../assets/fonts/GeistLike-Regular.ttf",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../assets/fonts/GeistLike-Mono.ttf",
  variable: "--font-geist-mono",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://app.dhadash.com",
  ),
  manifest: "/manifest.webmanifest",
  title: {
    default: "Dhadash — Govt. Primary School Operations",
    template: "%s | Dhadash",
  },
  description:
    "সরকারি প্রাথমিক বিদ্যালয় (১ম–৫ম শ্রেণি) এর জন্য attendance, fee ও office workflow platform.",
  keywords: [
    "govt primary school software",
    "bangladesh school management",
    "dhadash",
    "attendance register print",
    "fee receipt print",
  ],
  authors: [{ name: "Dhadash" }],
  creator: "Dhadash",
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: ["/icons/favicon-32.png", "/favicon.ico"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dhadash",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "Dhadash",
    title: "Dhadash — সরকারি প্রাথমিক বিদ্যালয়ের ডিজিটাল অফিস সিস্টেম",
    description: "Attendance register, fee receipt ও নোটিশ workflow এক প্ল্যাটফর্মে।",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhadash",
    description: "Govt. Primary schools (Class 1–5) এর জন্য Bangladesh-first platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e11" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("locale")?.value);
  const isBangla = locale === "bn";

  return (
    <html
      lang={isBangla ? "bn" : "en"}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable}`}
    >
      <body className={`${isBangla ? "font-bn" : "font-sans"} antialiased`}>
        <ServiceWorkerRegistration />
        <TabLoadingIndicator />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
