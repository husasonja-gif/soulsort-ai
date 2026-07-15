import Image from "next/image";

const ORGANIZER_PANELS = [
  {
    id: "b",
    label: "Where the crowd went",
    caption: "Anonymous landing heatmap — portal pull across Power, Desire, Community, Safety.",
    src: "/marketing/orga-profile-b.png",
    alt: "Organizer view of where the crowd went with portal gravity and landing patterns",
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
        Organizer dashboard — the crowd, never an individual
      </p>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
        {ORGANIZER_PANELS.map((panel) => (
          <article key={panel.id} className="flex flex-col bg-[var(--background)]">
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
                sizes="(max-width: 768px) 100vw, 33vw"
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
