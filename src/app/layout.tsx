// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "scholaOps — Precision School Management",
    template: "%s | scholaOps",
  },
  description:
    "Professional-grade school operations platform. Precision engineered for administrative efficiency and institutional excellence.",
  keywords: [
    "school management system",
    "education ERP",
    "scholaOps",
    "academic administration",
    "school operations",
  ],
  authors: [{ name: "scholaOps" }],
  creator: "scholaOps",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "scholaOps",
    title: "scholaOps — Modern Education Infrastructure",
    description: "The professional operations platform for forward-thinking schools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "scholaOps",
    description: "The professional operations platform for forward-thinking schools.",
  },
  robots: {
    index: false,
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
      <body className="font-sans antialiased">
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
