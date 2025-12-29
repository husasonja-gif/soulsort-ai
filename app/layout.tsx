import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "SoulSort AI - A Vibe-Check Engine",
  description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
  openGraph: {
    title: "SoulSort AI - A Vibe-Check Engine",
    description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoulSort AI - A Vibe-Check Engine",
    description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
