import {
  PORTAL_PRIVACY_CONTACT_EMAIL,
  PORTAL_PRIVACY_SECTIONS,
  PORTAL_PRIVACY_TITLE,
} from "@/lib/portalPrivacy";

export function PrivacyStatement({ className = "" }: { className?: string }) {
  return (
    <article className={`space-y-6 text-sm leading-relaxed text-[var(--muted)] ${className}`.trim()}>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">{PORTAL_PRIVACY_TITLE}</h1>

      {PORTAL_PRIVACY_SECTIONS.map((section, i) => (
        <section key={section.heading ?? `intro-${i}`} className="space-y-3">
          {section.heading ? (
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{section.heading}</h2>
          ) : null}
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </section>
      ))}

      <p className="text-xs text-[var(--muted)]">
        Questions or deletion requests:{" "}
        <a
          href={`mailto:${PORTAL_PRIVACY_CONTACT_EMAIL}`}
          className="text-[var(--accent)] underline"
        >
          {PORTAL_PRIVACY_CONTACT_EMAIL}
        </a>
      </p>
    </article>
  );
}
