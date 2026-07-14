function OrgPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <p className="font-data text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniHeatmap() {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const points = [
    { a: 0.2, r: 0.4 },
    { a: 1.2, r: 0.55 },
    { a: 2.1, r: 0.35 },
    { a: 3.0, r: 0.7 },
    { a: 4.5, r: 0.5 },
    { a: 5.2, r: 0.62 },
  ];
  return (
    <svg width={size} height={size} className="mx-auto" aria-hidden>
      <circle cx={cx} cy={cy} r={48} fill="none" stroke="rgba(255,255,255,0.08)" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={cx + Math.cos(p.a) * p.r * 48}
          cy={cy + Math.sin(p.a) * p.r * 48}
          r={4}
          fill="var(--accent)"
          opacity={0.5}
        />
      ))}
    </svg>
  );
}

export function OrganizerDashboardMockups() {
  return (
    <div
      className="mx-auto grid w-full max-w-[320px] gap-3"
      role="img"
      aria-label="Organizer crowd dashboard mockups showing aggregate heatmap, situation summaries, and staff briefing"
    >
      <OrgPanel title="Where they went">
        <MiniHeatmap />
        <p className="mt-2 text-center font-data text-[9px] text-[var(--muted)]">
          Anonymous landing heatmap · n ≥ 10
        </p>
      </OrgPanel>

      <OrgPanel title="How they show up">
        <ul className="space-y-2 text-[11px] leading-snug text-[var(--muted)]">
          <li>Repair instinct strong across the cohort</li>
          <li>Biggest hesitation zone: self-care after the high</li>
        </ul>
      </OrgPanel>

      <OrgPanel title="Reading the room">
        <p className="text-[11px] leading-snug text-[var(--foreground)]">
          Consent range trending mid — brief door staff on pacing, not policing.
        </p>
      </OrgPanel>

      <OrgPanel title="Key takeaways">
        <p className="rounded-lg border border-[var(--accent)]/30 bg-black/40 p-3 text-[11px] leading-snug text-[var(--foreground)]">
          Tell your staff: this cohort skews deep Desire / low Safety — brief the
          chill-room team; put aftercare info in the welcome email.
        </p>
      </OrgPanel>
    </div>
  );
}
