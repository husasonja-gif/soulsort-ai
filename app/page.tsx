import type { Metadata } from "next";
import Script from "next/script";
import { PortalLanding } from "@/components/marketing/PortalLanding";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soulsortai.com";

const homepageDescription =
  "The world's first hype-and-onboarding tool for high-trust spaces. Attendees arrive prepared; organizers get anonymous crowd insight — never individual answers.";

export const metadata: Metadata = {
  description: homepageDescription,
  alternates: {
    canonical: appUrl,
  },
  openGraph: {
    title: "SoulSort PORTAL — Hype & onboarding for high-trust spaces",
    description: homepageDescription,
    url: appUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoulSort PORTAL",
    description:
      "The world's first hype-and-onboarding tool for high-trust spaces.",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SoulSort PORTAL",
  url: appUrl,
  description: homepageDescription,
};

export default function HomePage() {
  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PortalLanding />
    </>
  );
}
