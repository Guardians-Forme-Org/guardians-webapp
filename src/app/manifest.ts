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
    ],
  };
}
