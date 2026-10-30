import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";

// Self-hosted fonts: no Google Fonts request, so the app builds and runs offline (expo Wi-Fi safe).
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: {
    default: "StudyBro AI — Your AI Study Bro",
    template: "%s · StudyBro AI",
  },
  description:
    "Study smarter, stay focused, and build better habits with StudyBro AI — an AI companion that watches your focus, not your privacy.",
  keywords: ["study", "focus", "AI", "pomodoro", "productivity", "student", "computer vision"],
  openGraph: {
    title: "StudyBro AI — Your AI Study Bro",
    description: "Study smarter, stay focused, and build better habits with StudyBro AI.",
    type: "website",
  },
  applicationName: "StudyBro AI",
  appleWebApp: { capable: true, title: "StudyBro", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fc" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-ambient">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
