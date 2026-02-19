import type { Metadata } from 'next';
import './globals.css';
import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL('https://aegiscampus-prime.example.com'),
  title: 'AegisCampus Prime | Institution Intelligence ERP',
  description:
    'A premium full-stack school operations platform engineered for reliability, secure workflows, and executive-grade academic intelligence.',
  applicationName: 'AegisCampus Prime',
  openGraph: {
    title: 'AegisCampus Prime',
    description:
      'Enterprise-ready school management with multi-tenant data integrity, analytics, and production-safe operational workflows.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AegisCampus Prime',
    description:
      'Production-grade school management platform crafted with deep fullstack engineering rigor.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
