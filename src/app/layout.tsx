import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClientAuthProvider } from "./context/ClientAuthProvider";
import ErrorBoundary from "./context/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetaUpSpace - AMS",
  description: "Developed in 2025 to centralize the attendance management system for MetaUpSpace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ClientAuthProvider>
            <SpeedInsights />
            <Analytics />
            {children}
          </ClientAuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}