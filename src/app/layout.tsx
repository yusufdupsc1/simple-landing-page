import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "ScholasticOS | Enterprise Education Management",
  description: "Advanced Academic Resource Planning for Modern Institutions",
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
