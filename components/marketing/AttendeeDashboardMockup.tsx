export function AttendeeDashboardMockup() {
  const portals = [
    { name: "POWER", pct: 72 },
    { name: "DESIRE", pct: 58 },
    { name: "COMMUNITY", pct: 81 },
    { name: "SAFETY", pct: 44 },
  ];

  const situations = [
    { tag: "comfort zone", tell: "You don't negotiate with your no — you plant it." },
    { tag: "working it out", tell: "Repair is communal for you — you turn toward the rupture." },
    { tag: "uncharted", tell: "Come-downs pull you inward — you'd rather ghost than be seen flat." },
  ];

  return (
    <div
      className="mx-auto w-full max-w-[320px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_0_40px_rgba(255,47,208,0.08)]"
      role="img"
      aria-label="Participant profile mockup showing portal fill meters and per-situation reads"
    >
      <p className="font-data text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
        SoulSort
      </p>
      <h3 className="mt-1 text-sm font-semibold">Your portal read</h3>
      <p className="text-[10px] text-[var(--muted)]">from how you moved</p>

      <div className="mt-4 space-y-2">
        <p className="font-data text-[9px] uppercase text-[var(--muted)]">Where you went</p>
        {portals.map((p) => (
          <div key={p.name}>
            <div className="flex justify-between font-data text-[9px]">
              <span>{p.name}</span>
              <span>{p.pct}%</span>
            </div>
            <div className="mt-0.5 h-1 rounded bg-[var(--border)]">
              <div
                className="h-full rounded bg-[var(--accent)]"
                style={{ width: `${p.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <p className="font-data text-[9px] uppercase text-[var(--muted)]">Your map</p>
        {situations.map((s) => (
          <div key={s.tell} className="rounded-lg border border-[var(--border)] p-2">
            <p className="font-data text-[8px] uppercase text-[var(--accent)]">{s.tag}</p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--foreground)]">{s.tell}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-[var(--border)] pt-3 text-center text-[10px] italic text-[var(--muted)]">
        With this, you&apos;re ready to step inside the vortex.
      </p>
    </div>
  );
}
