import { notFound } from "next/navigation";
import { Hind_Siliguri } from "next/font/google";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/getDict";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  if (locale === "bn") {
    return (
      <>
        <style>{`
          body {
            font-family: ${hindSiliguri.style.fontFamily}, var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
            font-variant-numeric: tabular-nums;
          }
        `}</style>
        {children}
      </>
    );
  }

  return children;
}
