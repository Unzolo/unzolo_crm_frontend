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
        <OfflineProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-center" richColors />
            <OfflineIndicator />
          </QueryProvider>
        </OfflineProvider>
      </body>
    </html>
  );
}
