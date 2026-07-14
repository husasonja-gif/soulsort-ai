import Image from "next/image";

const ORGANIZER_PANELS = [
  {
    id: "a",
    label: "Crowd read",
    caption: "Completions + anonymous landing heatmap.",
    src: "/marketing/orga-profile-a.png",
    alt: "Organizer crowd read showing 19 completions and anonymous portal landing heatmap",
  },
  {
    id: "b",
    label: "Portal gravity",
    caption: "Observation, could mean, and staff try-lines per portal.",
    src: "/marketing/orga-profile-b.png",
    alt: "Organizer portal gravity panels for Community and Safety with observation and try suggestions",
  },
  {
    id: "c",
    label: "How they show up",
    caption: "Category pulls across boundaries, intimacy, play, and the work.",
    src: "/marketing/orga-profile-c.png",
    alt: "Organizer how the crowd shows up with segmented portal bars per situation category",
  },
  {
    id: "d",
    label: "Reading the room",
    caption: "Consent scenarios — room-first vs you-first, strengths and gaps.",
    src: "/marketing/orga-profile-d.png",
    alt: "Organizer reading the room panel with consent scenario aggregate and crowd strengths",
  },
] as const;

export function OrganizerShowcaseGrid() {
  return (
    <div className="w-full">
      <p className="mb-6 text-center font-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
        Organizer — the crowd, never an individual
      </p>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-4">
        {ORGANIZER_PANELS.map((panel) => (
          <article
            key={panel.id}
            className="flex flex-col bg-[var(--background)]"
          >
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {panel.label}
              </p>
            </div>
            <div className="relative flex-1 bg-[#0a0610] p-2">
              <Image
                src={panel.src}
                alt={panel.alt}
                width={400}
                height={520}
                className="h-auto w-full rounded-sm object-contain object-top"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />
            </div>
            <p className="border-t border-[var(--border)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
              {panel.caption}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
