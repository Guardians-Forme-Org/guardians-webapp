import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import EnvBadge from "@/components/ui/EnvBadge";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOTF",
  description:
    "Guardians of the Future is a civic action platform that makes real-world community impact honest, visible, and worth proving.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GOTF",
  },
  icons: {
    apple: [
      { url: "/images/icons/apple-touch-icon-120.png", sizes: "120x120", type: "image/png" },
      { url: "/images/icons/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/images/icons/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/images/icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    icon: "/images/icons/icon-192.png",
  },
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
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!bg-black !text-white !border-0 !rounded-[8px]",
              error: "!bg-red-600",
            },
          }}
        />
        <EnvBadge />
        <Analytics />
        </body>
    </html>
  );
}
