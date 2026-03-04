import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dhadash",
    short_name: "Dhadash",
    description:
      "Govt. Primary school operations: attendance register, fees, receipt, and notices.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#006A4E",
    orientation: "portrait",
    lang: "bn",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
