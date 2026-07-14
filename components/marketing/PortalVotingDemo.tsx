"use client";

import { useEffect, useRef } from "react";

const ACCENT = "#ff2fd0";
const RESISTANCE_GAIN = 5.5;

const COMMUNITY = { x: -0.44, y: 0.58 };
const SAFETY = { x: 0.34, y: -0.68 };

function hypot(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

function applyResistance(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  target: { x: number; y: number }
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const rFrom = hypot(fromX, fromY) / Math.max(hypot(target.x, target.y), 0.01);
  const rTo = hypot(toX, toY) / Math.max(hypot(target.x, target.y), 0.01);
  const r = Math.max(Math.min(rFrom, 1), Math.min(rTo, 1));
  const movingOutward = hypot(toX, toY) > hypot(fromX, fromY) + 0.004;
  const gain = movingOutward ? RESISTANCE_GAIN : RESISTANCE_GAIN * 0.4;
  const resistance = 1 + gain * Math.pow(r, 1.5);
  let nx = fromX + dx / resistance;
  let ny = fromY + dy / resistance;
  const dist = hypot(nx, ny);
  if (dist > 1) {
    nx /= dist;
    ny /= dist;
  }
  return { x: nx, y: ny };
}

function buildPath() {
  const points: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  const steps: Array<{ raw: [number, number]; target: { x: number; y: number } }> = [
    { raw: [-0.18, 0.22], target: COMMUNITY },
    { raw: [-0.32, 0.42], target: COMMUNITY },
    { raw: [-0.44, 0.58], target: COMMUNITY },
    { raw: [COMMUNITY.x * 0.94, COMMUNITY.y * 0.95], target: COMMUNITY },
    { raw: [COMMUNITY.x * 0.82, COMMUNITY.y * 0.86], target: COMMUNITY },
    { raw: [-0.1, 0.55], target: SAFETY },
    { raw: [0.12, 0.62], target: SAFETY },
    { raw: [SAFETY.x * 0.9, SAFETY.y * 0.92], target: SAFETY },
    { raw: [SAFETY.x, SAFETY.y], target: SAFETY },
  ];
  for (const s of steps) {
    const next = applyResistance(x, y, s.raw[0], s.raw[1], s.target);
    x = next.x;
    y = next.y;
    points.push({ x, y });
  }
  return points;
}

const PATH = buildPath();
const PORTALS = [
  { label: "DESIRE", x: 0.52, y: -0.52 },
  { label: "POWER", x: 0.52, y: 0.52 },
  { label: "COMMUNITY", x: -0.52, y: 0.52 },
  { label: "SAFETY", x: -0.52, y: -0.52 },
];

export function PortalVotingDemo() {
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

    let frame = 0;
    let raf = 0;
    const loopFrames = 240;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const half = Math.min(w, h) * 0.38;
      const progress = reducedMotion.current
        ? 1
        : (frame % loopFrames) / loopFrames;
      const pathIdx = Math.min(
        PATH.length - 1,
        Math.floor(progress * (PATH.length - 1))
      );
      const token = PATH[pathIdx];

      ctx.fillStyle = "#06040a";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);

      for (const p of PORTALS) {
        const px = cx + p.x * half;
        const py = cy + p.y * half;
        ctx.fillStyle = "rgba(255,47,208,0.35)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.label, px, py);
      }

      ctx.beginPath();
      for (let i = 0; i <= pathIdx; i++) {
        const px = cx + PATH[i].x * half;
        const py = cy + PATH[i].y * half;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(255,47,208,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const tx = cx + token.x * half;
      const ty = cy + token.y * half;
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(tx, ty, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e8e8ec";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("You messed up.", cx, cy - half - 24);
      ctx.fillStyle = "#888894";
      ctx.font="11px system-ui";
      ctx.fillText("How would you try to fix things?", cx, cy - half - 8);

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
      className="aspect-square w-full max-w-md rounded-xl border border-[var(--border)]"
      role="img"
      aria-label="Drag physics demo showing a statement card pulled through a portal field with resistance and path tracking"
    />
  );
}
