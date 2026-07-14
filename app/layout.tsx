import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soulsortai.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SoulSort PORTAL — Hype & onboarding for high-trust spaces",
    template: "%s | SoulSort PORTAL",
  },
  description:
    "The world's first hype-and-onboarding tool for raves, festivals, and sex-positive parties. Attendees arrive prepared; organizers get anonymous crowd insight — never individual answers.",
  openGraph: {
    title: "SoulSort PORTAL — Hype & onboarding for high-trust spaces",
    description:
      "Behavioural onboarding for high-trust spaces. Anonymous play, aggregate crowd reads, API-ready for your RSVP flow.",
    type: "website",
    url: appUrl,
    siteName: "SoulSort",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoulSort PORTAL",
    description:
      "The world's first hype-and-onboarding tool for high-trust spaces.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
