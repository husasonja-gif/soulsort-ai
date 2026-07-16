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
    <div className="relative min-h-screen w-full overflow-x-clip bg-[var(--background)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,47,208,0.06),transparent_50%)]"
        aria-hidden
      />

      {/* 1. Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl min-w-0 gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="min-w-0">
          <p className="font-data text-xs uppercase tracking-[0.2em] text-[var(--accent)] sm:tracking-[0.25em]">
            SoulSort PORTAL
          </p>
          <h1 className="mt-4 break-words text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl glow-accent">
            High-trust events need a crowd that knows how to vibe.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Set the tone upfront &amp; know what kind of crowd is stepping through your door.
          </p>
          <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#organizers"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 font-data text-sm font-medium text-black transition hover:brightness-110 sm:w-auto sm:px-6"
            >
              Bring PORTAL to your space
            </a>
            <a
              href="/portal"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 font-data text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] sm:w-auto sm:px-6"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="h-[240px] min-w-0 sm:h-[340px] md:h-[400px]">
          <PortalBannerHero />
        </div>
      </section>

      {/* 2. Drag physics — demo left, copy right */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-[var(--border)] px-4 py-16 sm:py-20"
      >
        <div className="mx-auto grid min-w-0 max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-12">
          <div className="flex w-full min-w-0 justify-center md:justify-start">
            <div className="w-full min-w-0 max-w-lg">
              <PortalVotingDemo />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
              Not another survey —{" "}
              <span className="text-[var(--soulsort-lime)]">a rehearsal</span>.
            </h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              PORTAL walks attendees through the real moments of a night and asks them to move,
              not tick a box. Built on how they move — where they drag, wait, hover, land — not
              what they claim about themselves.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Pre-game / attendee profile */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <h2 className="break-words text-2xl font-bold leading-tight sm:text-4xl">
            Community mindset is a muscle.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
            PORTAL trains it — surfacing reflexes and blind-spots, nudging toward growth.
          </p>
          <div className="mt-12 flex justify-center">
            <ParticipantDashboardShowcase />
          </div>
        </div>
      </section>

      {/* 4. Problem */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto min-w-0 max-w-4xl text-center">
          <h2 className="break-words text-2xl font-bold leading-tight text-[var(--soulsort-lime)] sm:text-4xl">
            High-trust spaces carry high stakes
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
            SoulSort solves the problem of a dead house-rules check-box.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 opacity-70">
              <p className="font-data text-xs uppercase text-[var(--muted)]">Before</p>
              <p className="mt-3 text-lg line-through decoration-[var(--accent)]">
                I have read the rules ☑
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Passive check-box. No rehearsal. Limited signal back to the org.
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

      {/* 5. Feedback + organizer dashboard */}
      <section className="relative z-10 border-t border-[var(--border)] px-4 py-20">
        <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-0">
          <h2 className="break-words text-center text-2xl font-bold leading-tight sm:text-4xl">
            Feedback is how we evolve: SoulSort shows you where you are at, both as a
            participant and as an organizer.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[var(--muted)] leading-relaxed">
            Organizers see the crowd — never an individual&apos;s answers. No identification.
            No biometrics. No device fingerprinting.
          </p>

          <div className="mt-16">
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
              "Designed with GDPR and EU AI Act constraints in mind — not a compliance badge",
              "Not biometric. Not surveillance.",
              "Deterministic scoring — no generative AI on your play",
              "You keep the attendee data you already manage — PORTAL adds none. We never receive it.",
              "No crowd read appears until enough people have played that no one can be singled out.",
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
        <div className="mx-auto min-w-0 max-w-3xl">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            For organizers
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
            PORTAL is running its first pilots now. Join the early adopters, have real influence
            on where this goes, and get a crowd read no one else has yet.
          </p>
          <div className="mt-10">
            <OrganizerWaitlistForm />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
