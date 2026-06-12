import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getLocale } from "next-intl/server";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOTF",
  description:
    "Guardians of the Future is a civic action platform that makes real-world community impact honest, visible, and worth proving.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#003518",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale().catch(() => "en");
  return (
    <html lang={locale} className={`${geist.variable} h-full`}>
      <body className="h-full bg-white text-zinc-900 antialiased">
          <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        </body>
    </html>
  );
}
