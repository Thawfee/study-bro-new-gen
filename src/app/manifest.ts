import type { MetadataRoute } from "next";

/** Installable app (PWA): "Add to Home Screen" on phones, "Install" on desktop. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyBro AI — AI Study Coach",
    short_name: "StudyBro",
    description: "Focus sessions with on-device AI, recall checks, fatigue prediction and session reports.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    orientation: "any",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Start focus session", url: "/focus" },
      { name: "Review flashcards", url: "/review" },
    ],
  };
}
