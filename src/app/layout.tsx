// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Syne, DM_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@/styles/globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ScholasticOS — School Management",
    template: "%s | ScholasticOS",
  },
  description:
    "Production-grade school management SaaS. Manage students, teachers, attendance, grades, and finance in one platform.",
  keywords: [
    "school management",
    "SaaS",
    "education",
    "students",
    "attendance",
    "grades",
  ],
  authors: [{ name: "ScholasticOS" }],
  creator: "ScholasticOS",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ScholasticOS",
    title: "ScholasticOS — School Management Platform",
    description: "Modern school management SaaS for institutions of any size.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholasticOS",
    description: "Modern school management SaaS for institutions of any size.",
  },
  robots: {
    index: false, // App is SaaS — no indexing of dashboards
    follow: false,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${dmMono.variable} font-sans antialiased`}
      >
        <NuqsAdapter>
          <SessionProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                },
              }}
            />
          </SessionProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
