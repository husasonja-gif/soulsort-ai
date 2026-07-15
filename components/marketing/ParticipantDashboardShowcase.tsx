"use client";

import { useEffect, useState } from "react";

export function ParticipantDashboardShowcase() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-sm px-2 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-[0_0_48px_rgba(255,47,208,0.08)]">
        <video
          src="/marketing/attendee-dashboard.mp4"
          autoPlay={!reducedMotion}
          muted
          loop={!reducedMotion}
          playsInline
          controls={reducedMotion}
          preload="metadata"
          className="w-full object-cover object-top"
          aria-label="SoulSort PORTAL participant profile dashboard recording"
        />
      </div>
      <p className="mt-3 text-center font-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
        Participant profile — yours only
      </p>
    </div>
  );
}
