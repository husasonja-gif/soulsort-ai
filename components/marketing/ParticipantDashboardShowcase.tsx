"use client";

import { useEffect, useRef, useState } from "react";

export function ParticipantDashboardShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controls, setControls] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const useControls = reduced || mobile || touch;

    setControls(useControls);

    const video = videoRef.current;
    if (!video || useControls) return;

    video.play().catch(() => setControls(true));
  }, []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[200px] sm:max-w-xs">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-[0_0_48px_rgba(255,47,208,0.08)]">
        <video
          ref={videoRef}
          src="/marketing/attendee-dashboard.mp4"
          muted
          loop
          playsInline
          controls={controls}
          preload="metadata"
          className="h-auto max-h-[320px] w-full object-contain object-top sm:max-h-[480px]"
          aria-label="SoulSort PORTAL participant profile dashboard recording"
        />
      </div>
      <p className="mt-3 text-center font-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
        Participant profile — yours only
      </p>
    </div>
  );
}
