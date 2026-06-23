import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guardians of the Future",
    short_name: "GOTF",
    description:
      "Guardians of the Future is a civic action platform that makes real-world community impact honest, visible, and worth proving.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#003518",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/images/192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/images/512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  };
}
