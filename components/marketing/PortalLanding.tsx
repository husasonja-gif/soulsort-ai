"use client";

import Link from "next/link";
import { PortalBannerHero } from "@/components/marketing/PortalBannerHero";
import { PortalVotingDemo } from "@/components/marketing/PortalVotingDemo";
import { ParticipantDashboardShowcase } from "@/components/marketing/ParticipantDashboardShowcase";
import { OrganizerShowcaseGrid } from "@/components/marketing/OrganizerShowcaseGrid";
import { OrganizerWaitlistForm } from "@/components/marketing/OrganizerWaitlistForm";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export function PortalLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,47,208,0.06),transparent_50%)]"
        aria-hidden
      />

      {/* 1. Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="font-data text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
            SoulSort PORTAL
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl glow-accent">
            The world&apos;s first hype &amp; onboarding tool for high-trust spaces.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
            Help attendees arrive knowing what to expect. Give organizers a vibe-aware crowd
            read — completion signals and anonymous aggregates, never individual answers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#organizers"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 font-data text-sm font-medium text-black transition hover:brightness-110"
            >
              Bring PORTAL to your space
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[var(--border)] px-6 font-data text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="h-[280px] sm:h-[340px] md:h-[400px]">
          <PortalBannerHero />
        </div>
      </section>

      {/* 2. Not a survey */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-[var(--border)] px-4 py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <PortalVotingDemo />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              Not a personality survey → next-gen behavioral assessment based on drag physics.
            </h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              One gesture per scenario. Where you drag, how long you wait, where you hover,
              where you land — continuous signal, not multiple choice.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Attendees */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            SoulSort PORTAL reads how attendees move, helping them navigate the dancefloor
            with more awareness &amp; community mindset.
          </h2>
          {/* reads — not watches: sensitive scene; avoid surveillance framing */}
          <p className="mt-4 text-sm text-[var(--muted)]">
            Behavioural response data for self-knowledge — not identification. No biometrics.
            No device fingerprinting.
          </p>
        </div>
      </section>

      {/* 4. Problem */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            High-trust spaces carry high stakes — SoulSort solves the problem of a dead
            house-rules check-box by helping attendees simulate the desired behaviors before
            they&apos;ve even stepped inside.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 opacity-70">
              <p className="font-data text-xs uppercase text-[var(--muted)]">Before</p>
              <p className="mt-3 text-lg line-through decoration-[var(--accent)]">
                I have read the rules ☑
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Passive checkbox. No rehearsal. No signal back to the org.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--accent)]/50 bg-[var(--panel)] p-6">
              <p className="font-data text-xs uppercase text-[var(--accent)]">After PORTAL</p>
              <p className="mt-3 text-lg font-medium">
                Active walk-through of real scenarios
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Attendees arrive with a profile. Organizers get completion + anonymous crowd
                shape.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Dashboards */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Feedback is how we evolve: SoulSort shows you where you are at, both as a
            participant and as an organizer.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--muted)]">
            Organizers see the crowd — never an individual&apos;s answers. Pre-aggregated
            only, with a k-anonymity floor.
          </p>

          <div className="mt-16 flex justify-center">
            <ParticipantDashboardShowcase />
          </div>

          <div className="mt-20">
            <OrganizerShowcaseGrid />
          </div>
        </div>
      </section>

      {/* 6. Privacy */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 md:p-12">
          <h2 className="font-data text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Privacy &amp; ethics
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "No PII alongside gameplay — anonymous codes only",
              "Organizers see completion + anonymous aggregate, never your answers",
              "Deletion on request — consent-forward by design",
              "GDPR & EU AI Act conscious architecture",
              "Not biometric. Not surveillance.",
              "Deterministic scoring — no generative AI on your play",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-[var(--accent)]" aria-hidden>
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href="/privacy"
              className="font-data text-sm text-[var(--accent)] underline underline-offset-4"
            >
              Read the full privacy statement →
            </Link>
          </p>
        </div>
      </section>

      {/* 7. Organizers */}
      <section id="organizers" className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            For organizers
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
            Replace the manual form and dead checkbox. Receive a better-prepared, more
            consent-aware crowd. Get aggregate insight that helps you program and brief staff.
            Designed to integrate with your existing membership or RSVP flow — completion
            signals via API, embeddable when you&apos;re ready.
          </p>
          <div className="mt-10">
            <OrganizerWaitlistForm />
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <MarketingFooter />
    </div>
  );
}
