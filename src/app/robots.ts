import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.dhadash.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy"],
        disallow: ["/dashboard", "/api", "/auth"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
