import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unzolo CRM",
  description: "Premium CRM for modern businesses",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png?v=2",
    apple: [
      { url: "/icon-192x192.png?v=2", sizes: "192x192" },
      { url: "/icon-512x512.png?v=2", sizes: "512x512" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unzolo CRM",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};



import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { OfflineProvider } from "@/components/offline-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PwaInstallBanner } from "@/components/pwa-install-prompt";
import { MainLayout } from "@/components/main-layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSans.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <OfflineProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster position="top-center" richColors />
            <OfflineIndicator />
            <PwaInstallBanner />
          </OfflineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
