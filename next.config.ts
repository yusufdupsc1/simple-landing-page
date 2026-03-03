// next.config.ts
import { createRequire } from "module";
import type { NextConfig } from "next";

type NextConfigTransform = (config: NextConfig) => NextConfig;

const require = createRequire(import.meta.url);

const withBundleAnalyzer: NextConfigTransform = (() => {
  try {
    const bundleAnalyzer = require("@next/bundle-analyzer");
    const createAnalyzer = bundleAnalyzer.default ?? bundleAnalyzer;
    return createAnalyzer({
      enabled: process.env.ANALYZE === "true",
    }) as NextConfigTransform;
  } catch {
    // Optional dependency: keep builds working when analyzer package is not installed.
    return (config: NextConfig) => config;
  }
})();

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Required for Docker "standalone" runtime image
  output: "standalone",

  // Reduce client bundle overhead for large many-export packages.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // TypeScript — errors block production builds
  typescript: { ignoreBuildErrors: false },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              [
                "script-src 'self' 'unsafe-inline' https://js.stripe.com https://vercel.live",
                isDev ? "'unsafe-eval'" : "",
              ]
                .filter(Boolean)
                .join(" "),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: https://utfs.io",
              "font-src 'self' data:",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "connect-src 'self' https://api.stripe.com https://uploadthing.com https://vercel.live wss:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default withBundleAnalyzer(nextConfig);
