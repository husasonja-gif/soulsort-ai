import {
  ReadingTheRoomMockup,
  WhereTheCrowdWentMockup,
  WhereTheyCanGrowMockup,
} from "@/components/marketing/OrganizerShowcaseMockups";

const ORGANIZER_PANELS = [
  {
    id: "where",
    label: "Where the crowd went",
    Mockup: WhereTheCrowdWentMockup,
  },
  {
    id: "reading",
    label: "Reading the room",
    Mockup: ReadingTheRoomMockup,
  },
  {
    id: "grow",
    label: "Where they can grow",
    Mockup: WhereTheyCanGrowMockup,
  },
] as const;

export function OrganizerShowcaseGrid() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip">
      <p className="mb-6 px-1 text-center font-data text-[10px] uppercase tracking-wide text-[var(--muted)] sm:tracking-widest">
        Organizer dashboard — the crowd, never an individual
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
        {ORGANIZER_PANELS.map(({ id, label, Mockup }) => (
          <article key={id} className="flex min-w-0 flex-col bg-[var(--background)]">
            <div className="border-b border-[var(--border)] px-3 py-3 sm:px-4">
              <p className="font-data text-[10px] uppercase tracking-wide break-words text-[var(--accent)] sm:tracking-[0.14em]">
                {label}
              </p>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden bg-[#0a0610] p-3 sm:p-4">
              <Mockup />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
