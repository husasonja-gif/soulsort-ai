"use client";

import { useEffect, useState } from "react";

/**
 * Original portal-voting-demo.html from SoulSort folder — full card, drag path, tracking.exe.
 */
export function PortalVotingDemo() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="mx-auto aspect-square w-full max-w-lg rounded-xl border border-[var(--border)] bg-[#06040a]"
        aria-hidden
      />
    );
  }

  if (reducedMotion) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <video
          src="/marketing/portal-voting-demo.mp4"
          muted
          playsInline
          controls
          preload="metadata"
          className="aspect-square w-full rounded-xl border border-[var(--border)] bg-[#06040a] object-cover"
          aria-label="PORTAL drag physics demo showing scenario card pulled through portal field with path tracking"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[#06040a]">
      <iframe
        src="/marketing/portal-voting-demo.html?preview"
        title="PORTAL drag physics demo"
        className="aspect-square w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
