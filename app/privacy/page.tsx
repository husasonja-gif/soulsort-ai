import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PrivacyStatement } from "@/components/marketing/PrivacyStatement";

export const metadata: Metadata = {
  title: "Privacy statement",
  description:
    "PORTAL privacy, plainly: anonymous play, no PII alongside gameplay, organizer aggregates only, deletion on request.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          SoulSort PORTAL
        </p>
        <div className="mt-6">
          <PrivacyStatement />
        </div>
        <p className="mt-10">
          <Link href="/" className="text-[var(--accent)] underline">
            ← Back to homepage
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
