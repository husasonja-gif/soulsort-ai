import type { ReactNode } from "react";

const ACCENT = "#ff2fd0";
const ACCENT_DIM = "rgba(255, 47, 208, 0.35)";
const ACCENT_MID = "rgba(255, 47, 208, 0.55)";
const ACCENT_SOFT = "rgba(255, 47, 208, 0.22)";

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-data text-[9px] uppercase tracking-[0.12em] text-[#9a8aaa]">{children}</p>
  );
}

function TryBox({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 rounded-lg border border-[var(--border)] bg-[#0a0610] px-3 py-2 text-xs leading-relaxed text-[var(--accent)]">
      {children}
    </p>
  );
}

function PullBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1a1024]">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        aria-hidden
      />
    </div>
  );
}

function MixBar({ segments }: { segments: Array<{ pct: number; tone: string }> }) {
  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#1a1024]">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="h-full"
          style={{ width: `${seg.pct}%`, backgroundColor: seg.tone }}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function WhereTheCrowdWentMockup() {
  return (
    <div className="space-y-4 text-xs leading-relaxed">
      <p className="text-center text-[10px] text-[var(--muted)]">
        Average portal pull — Power, Desire, Community, Safety.
      </p>
      <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24" aria-hidden>
        <circle cx="60" cy="60" r="48" fill="none" stroke={ACCENT_DIM} strokeWidth="1" />
        {[
          [60, 18],
          [98, 60],
          [60, 102],
          [22, 60],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4 + i} fill={ACCENT} opacity={0.35 + i * 0.12} />
        ))}
        {[
          ["Power", 60, 10],
          ["Desire", 110, 60],
          ["Community", 60, 110],
          ["Safety", 10, 60],
        ].map(([label, x, y]) => (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={ACCENT}
            fontSize="7"
            fontWeight="600"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between gap-2 text-[#ece2f6]">
            <span>Community — looking after others, holding the group</span>
            <span style={{ color: ACCENT }}>29%</span>
          </div>
          <PullBar pct={29} />
        </div>
        <div>
          <div className="flex justify-between gap-2 text-[#ece2f6]">
            <span>Safety — keeping things steady and safe, for themselves and others</span>
            <span style={{ color: ACCENT }}>26%</span>
          </div>
          <PullBar pct={26} />
        </div>
      </div>

      <dl className="space-y-2">
        <div>
          <Label>Observation</Label>
          <dd className="mt-0.5 text-[#ece2f6]">Community is running high.</dd>
        </div>
        <div>
          <Label>Could mean</Label>
          <dd className="mt-0.5 text-[#d8cce6]">
            A crowd that self-governs well and holds each other; your job is lighter here.
          </dd>
        </div>
        <div>
          <Label>Try</Label>
          <TryBox>
            Let the door lean on that — &apos;look after each other&apos; lands with a crowd
            already wired for it.
          </TryBox>
        </div>
      </dl>
    </div>
  );
}

const CATEGORY_ROWS = [
  {
    name: "Boundaries",
    gloss: "moments where a line gets tested or crossed",
    badge: "47% · Power-led",
    segments: [
      { pct: 47, tone: ACCENT },
      { pct: 22, tone: ACCENT_MID },
      { pct: 18, tone: ACCENT_SOFT },
      { pct: 13, tone: ACCENT_DIM },
    ],
  },
  {
    name: "Intimacy",
    gloss: "moments of closeness, wanting, sex/connection",
    badge: "32% · Power-led",
    segments: [
      { pct: 32, tone: ACCENT },
      { pct: 28, tone: ACCENT_MID },
      { pct: 25, tone: ACCENT_SOFT },
      { pct: 15, tone: ACCENT_DIM },
    ],
  },
  {
    name: "Play",
    gloss: "moments of fun, dancing, silliness, expression",
    badge: "47% · Power-led",
    segments: [
      { pct: 47, tone: ACCENT },
      { pct: 20, tone: ACCENT_MID },
      { pct: 18, tone: ACCENT_SOFT },
      { pct: 15, tone: ACCENT_DIM },
    ],
  },
  {
    name: "The Work",
    gloss: "looking after each other and yourself (crisis, comedown, care)",
    badge: "37% · Community-led",
    segments: [
      { pct: 37, tone: ACCENT },
      { pct: 25, tone: ACCENT_MID },
      { pct: 20, tone: ACCENT_SOFT },
      { pct: 18, tone: ACCENT_DIM },
    ],
  },
] as const;

export function HowTheyShowUpMockup() {
  return (
    <div className="space-y-3 text-xs leading-relaxed">
      <p className="text-center text-[10px] text-[var(--muted)]">
        Bar width = share of landings in that portal.
      </p>
      {CATEGORY_ROWS.map((row) => (
        <div key={row.name} className="rounded-lg border border-[var(--border)] bg-[#0e0814] px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[#ece2f6]">{row.name}</span>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
              style={{ color: ACCENT, borderColor: ACCENT_DIM, backgroundColor: ACCENT_SOFT }}
            >
              {row.badge}
            </span>
          </div>
          <p className="mt-1 text-[#b8a8c8]">
            {row.name} — {row.gloss}
          </p>
          <MixBar segments={[...row.segments]} />
        </div>
      ))}
    </div>
  );
}

export function ReadingTheRoomMockup() {
  return (
    <div className="space-y-3 text-xs leading-relaxed">
      <dl className="space-y-2">
        <div>
          <Label>Observation</Label>
          <dd className="mt-0.5 text-[#ece2f6]">
            The game has specific consent scenarios. This crowd leaned room-first (taking care of
            others) — expect overall considerate attendees.
          </dd>
        </div>
        <div>
          <Label>Could mean</Label>
          <dd className="mt-0.5 text-[#d8cce6]">strong collective instincts; the door can be light.</dd>
        </div>
        <div>
          <Label>Try</Label>
          <TryBox>
            name the 1–2 challenges (below) anyway — a light reminder still helps.
          </TryBox>
        </div>
      </dl>

      <p className="text-[#d8cce6]">
        Across 126 room-attuned choices, the crowd leaned toward{" "}
        <strong className="text-[#f5eef8]">the room</strong>.
      </p>

      <div>
        <div className="relative h-2 overflow-hidden rounded-full bg-[#1a1024]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${ACCENT_SOFT} 0%, ${ACCENT_MID} 45%, ${ACCENT} 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f5eef8] bg-[#120a1c]"
            style={{ left: "72%" }}
            aria-hidden
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-medium">
          <span style={{ color: ACCENT_MID }}>you first</span>
          <span style={{ color: ACCENT }}>room first</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-[#b8a8c8]">Crowd is good at</span>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ color: ACCENT, borderColor: ACCENT_DIM }}
          >
            partner goes still - nervous laugh - the repair
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[#b8a8c8]">Crowd is weak at</span>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ color: ACCENT_MID, borderColor: ACCENT_DIM }}
          >
            the dancefloor push - your own limit
          </span>
        </div>
      </div>
    </div>
  );
}
