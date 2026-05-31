import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hemstatistik",
    short_name: "Hemstatistik",
    start_url: "/sv",
    scope: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    icons: [
      { src: "/icon1", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
