import type { ReactNode } from "react";

const LIME = "#a3e635";
const LIME_DIM = "rgba(163, 230, 53, 0.35)";
const LIME_MID = "rgba(163, 230, 53, 0.55)";
const LIME_SOFT = "rgba(163, 230, 53, 0.22)";
/** Growth zones — high contrast: fuchsia / gold / lime */
const ZONE_UNCHARTERED = "#ff2fd0";
const ZONE_WORKING = "#ffc24b";
const ZONE_COMFORT = "#a3e635";

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-data text-[9px] uppercase tracking-[0.12em] text-[#9a8aaa]">{children}</p>
  );
}

function TryBox({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 rounded-lg border border-[var(--border)] bg-[#0a0610] px-3 py-2 text-xs leading-relaxed text-[var(--soulsort-lime)]">
      {children}
    </p>
  );
}

function PullBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1a1024]">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: LIME }}
        aria-hidden
      />
    </div>
  );
}

export function WhereTheCrowdWentMockup() {
  return (
    <div className="min-w-0 space-y-4 text-xs leading-relaxed">
      <svg viewBox="0 0 120 120" className="mx-auto h-20 w-20 sm:h-24 sm:w-24" aria-hidden>
        <circle cx="60" cy="60" r="48" fill="none" stroke={LIME_DIM} strokeWidth="1" />
        {[
          [60, 18],
          [98, 60],
          [60, 102],
          [22, 60],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4 + i} fill={LIME} opacity={0.35 + i * 0.12} />
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
            fill={LIME}
            fontSize="7"
            fontWeight="600"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <span className="min-w-0 break-words text-[#ece2f6]">
            Community — looking after others, holding the group
          </span>
          <span className="shrink-0 font-medium" style={{ color: LIME }}>
            29%
          </span>
        </div>
        <PullBar pct={29} />
      </div>

      <dl className="min-w-0 space-y-2">
        <div>
          <Label>Observation</Label>
          <dd className="mt-0.5 break-words text-[#ece2f6]">Community is running high.</dd>
        </div>
        <div>
          <Label>Could mean</Label>
          <dd className="mt-0.5 break-words text-[#d8cce6]">
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

export function ReadingTheRoomMockup() {
  return (
    <div className="min-w-0 space-y-3 text-xs leading-relaxed">
      <dl className="space-y-2">
        <div>
          <Label>Observation</Label>
          <dd className="mt-0.5 break-words text-[#ece2f6]">
            This crowd leaned room-first (taking care of others) — expect overall considerate
            attendees.
          </dd>
        </div>
        <div>
          <Label>Could mean</Label>
          <dd className="mt-0.5 break-words text-[#d8cce6]">
            Strong collective instincts; the door can be light.
          </dd>
        </div>
        <div>
          <Label>Try</Label>
          <TryBox>
            Name the 1–2 challenges (below) anyway — a light reminder still helps.
          </TryBox>
        </div>
      </dl>

      <p className="break-words text-[#d8cce6]">
        Across 126 room-attuned choices, the crowd leaned toward{" "}
        <strong className="text-[#f5eef8]">the room</strong>.
      </p>

      <div className="min-w-0">
        <div className="relative h-2 overflow-hidden rounded-full bg-[#1a1024]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${LIME_SOFT} 0%, ${LIME_MID} 45%, ${LIME} 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f5eef8] bg-[#120a1c]"
            style={{ left: "72%" }}
            aria-hidden
          />
        </div>
        <div className="mt-1.5 flex justify-between gap-2 text-[10px] font-medium">
          <span className="shrink-0" style={{ color: LIME_MID }}>
            you first
          </span>
          <span className="shrink-0" style={{ color: LIME }}>
            room first
          </span>
        </div>
      </div>

      <div className="min-w-0 space-y-2 pt-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-[#b8a8c8]">Crowd is good at</span>
          <span
            className="inline-block max-w-full break-words rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ color: LIME, borderColor: LIME_DIM }}
          >
            Partner goes still - nervous laugh - the repair
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[#b8a8c8]">Crowd is weak at</span>
          <span
            className="inline-block max-w-full break-words rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ color: LIME_MID, borderColor: LIME_DIM }}
          >
            The dancefloor push - your own limit
          </span>
        </div>
      </div>
    </div>
  );
}

/** Reduced showcase — one situation per category, all three growth zones present. */
const GROWTH_ROWS = [
  {
    category: "Boundaries",
    name: "setting limits",
    uncharteredPct: 18,
    workingPct: 30,
    comfortPct: 52,
  },
  {
    category: "Connection",
    name: "initiating connection",
    uncharteredPct: 12,
    workingPct: 20,
    comfortPct: 68,
  },
  {
    category: "Play",
    name: "allowing silliness",
    uncharteredPct: 22,
    workingPct: 25,
    comfortPct: 53,
  },
  {
    category: "The work",
    name: "calming yourself",
    uncharteredPct: 8,
    workingPct: 15,
    comfortPct: 77,
  },
] as const;

function GrowthBar({
  name,
  uncharteredPct,
  workingPct,
  comfortPct,
}: {
  name: string;
  uncharteredPct: number;
  workingPct: number;
  comfortPct: number;
}) {
  const split = [
    `${uncharteredPct}% unchartered`,
    `${workingPct}% working`,
    `${comfortPct}% comfort`,
  ].join(" · ");

  return (
    <div className="min-w-0">
      <div className="mb-1 flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
        <span className="break-words text-[11px] text-[#d8cce6]">{name}</span>
        <span className="shrink-0 text-[10px] text-[#9a8aaa] sm:text-right">{split}</span>
      </div>
      <div className="flex h-3 min-w-0 overflow-hidden rounded-full bg-[#1a1024]">
        <div
          className="h-full min-w-0 border-r border-black/40 last:border-r-0"
          style={{ width: `${uncharteredPct}%`, backgroundColor: ZONE_UNCHARTERED }}
          title={`Unchartered ${uncharteredPct}%`}
          aria-hidden
        />
        <div
          className="h-full min-w-0 border-r border-black/40 last:border-r-0"
          style={{ width: `${workingPct}%`, backgroundColor: ZONE_WORKING }}
          title={`Working it out ${workingPct}%`}
          aria-hidden
        />
        <div
          className="h-full min-w-0"
          style={{ width: `${comfortPct}%`, backgroundColor: ZONE_COMFORT }}
          title={`Comfort ${comfortPct}%`}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function WhereTheyCanGrowMockup() {
  return (
    <div className="min-w-0 space-y-4 text-xs leading-relaxed">
      <p className="text-center text-[10px] text-[var(--muted)]">
        Share of the crowd per situation — comfort, working it out, unchartered.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.08em]">
        <span style={{ color: ZONE_UNCHARTERED }}>unchartered</span>
        <span style={{ color: ZONE_WORKING }}>working it out</span>
        <span style={{ color: ZONE_COMFORT }}>comfort</span>
      </div>
      <div className="space-y-4">
        {GROWTH_ROWS.map((row) => (
          <div key={row.name} className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold text-[#c4b4d4]">{row.category}</p>
            <GrowthBar
              name={row.name}
              uncharteredPct={row.uncharteredPct}
              workingPct={row.workingPct}
              comfortPct={row.comfortPct}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
