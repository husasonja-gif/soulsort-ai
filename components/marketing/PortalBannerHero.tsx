"use client";

import { useEffect, useRef } from "react";

const ACCENT = "#ff2fd0";

export function PortalBannerHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2,
      r: 0.22 + (i % 7) * 0.09,
      speed: 0.0011 + (i % 5) * 0.00035,
      phase: (i * 0.7) % (Math.PI * 2),
      size: 1.5 + (i % 3) * 0.5,
    }));

    let frame = 0;
    let raf = 0;
    const staticFrame = 45;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w * 0.72;
      const cy = h * 0.5;
      const fieldR = Math.min(h, w) * 0.48;
      const f = reducedMotion.current ? staticFrame : frame;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w * 0.55, 0);
      g.addColorStop(0, "#000");
      g.addColorStop(1, "rgba(255,47,208,0.06)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const pulse = 0.5 + 0.5 * Math.sin(f * 0.035);
      ctx.strokeStyle = `rgba(255, 47, 208, ${0.28 + pulse * 0.12})`;
      ctx.lineWidth = 1.5;
      for (const ring of [0.25, 0.5, 0.75, 0.95]) {
        ctx.beginPath();
        ctx.arc(cx, cy, fieldR * ring, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const n of nodes) {
        const a = n.angle + f * n.speed + Math.sin(f * 0.012 + n.phase) * 0.025;
        const x = cx + Math.cos(a) * n.r * fieldR;
        const y = cy + Math.sin(a) * n.r * fieldR;
        ctx.fillStyle = "rgba(255,47,208,0.75)";
        ctx.beginPath();
        ctx.arc(x, y, n.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const tokenA = f * 0.018;
      const tx = cx + Math.cos(tokenA) * fieldR * 0.55;
      const ty = cy + Math.sin(tokenA) * fieldR * 0.55;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.stroke();

      if (!reducedMotion.current) frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full rounded-xl border border-[var(--border)] bg-black"
      role="img"
      aria-label="Animated portal vortex with drifting nodes and orbital rings"
    />
  );
}
