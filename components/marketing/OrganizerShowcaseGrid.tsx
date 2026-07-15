import {
  HowTheyShowUpMockup,
  ReadingTheRoomMockup,
  WhereTheCrowdWentMockup,
} from "@/components/marketing/OrganizerShowcaseMockups";

const ORGANIZER_PANELS = [
  {
    id: "where",
    label: "Where the crowd went",
    caption: "Anonymous landing heatmap — portal pull across Power, Desire, Community, Safety.",
    Mockup: WhereTheCrowdWentMockup,
  },
  {
    id: "how",
    label: "How they show up",
    caption: "Category pulls across boundaries, intimacy, play, and the work.",
    Mockup: HowTheyShowUpMockup,
  },
  {
    id: "reading",
    label: "Reading the room",
    caption: "Consent scenarios — room-first vs you-first, strengths and gaps.",
    Mockup: ReadingTheRoomMockup,
  },
] as const;

export function OrganizerShowcaseGrid() {
  return (
    <div className="w-full">
      <p className="mb-6 text-center font-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
        Organizer dashboard — the crowd, never an individual
      </p>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
        {ORGANIZER_PANELS.map(({ id, label, caption, Mockup }) => (
          <article key={id} className="flex flex-col bg-[var(--background)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {label}
              </p>
            </div>
            <div className="flex-1 bg-[#0a0610] p-3 sm:p-4">
              <Mockup />
            </div>
            <p className="border-t border-[var(--border)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
              {caption}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
