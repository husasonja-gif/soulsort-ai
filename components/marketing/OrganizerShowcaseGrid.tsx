import { WhereTheyCanGrowMockup } from "@/components/marketing/OrganizerShowcaseMockups";

export function OrganizerShowcaseGrid() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-lg overflow-x-clip">
      <p className="mb-6 px-1 text-center font-data text-[10px] uppercase tracking-wide text-[var(--muted)] sm:tracking-widest">
        Organizer dashboard — the crowd, never an individual
      </p>
      <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-3 py-3 sm:px-4">
          <p className="font-data text-[10px] uppercase tracking-wide break-words text-[var(--accent)] sm:tracking-[0.14em]">
            Where they can grow
          </p>
        </div>
        <div className="min-w-0 overflow-hidden bg-[#0a0610] p-3 sm:p-4">
          <WhereTheyCanGrowMockup />
        </div>
      </article>
    </div>
  );
}
