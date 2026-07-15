"use client";

import { useEffect, useState } from "react";

/**
 * Original portal-voting-demo.html — full card, drag path, tracking.exe.
 */
export function PortalVotingDemo({ className = "" }: { className?: string }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  const shell = `w-full min-h-[min(92vw,520px)] md:min-h-[560px] ${className}`.trim();

  if (!mounted) {
    return (
      <div
        className={`rounded-xl border border-[var(--border)] bg-[#06040a] ${shell}`}
        aria-hidden
      />
    );
  }

  if (reducedMotion) {
    return (
      <div className={shell}>
        <video
          src="/marketing/portal-voting-demo.mp4"
          muted
          playsInline
          controls
          preload="metadata"
          className="h-full min-h-[inherit] w-full rounded-xl border border-[var(--border)] bg-[#06040a] object-cover"
          aria-label="PORTAL drag physics demo showing scenario card pulled through portal field with path tracking"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[#06040a] ${shell}`}>
      <iframe
        src="/marketing/portal-voting-demo.html?preview"
        title="PORTAL drag physics demo"
        className="h-full min-h-[inherit] w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
