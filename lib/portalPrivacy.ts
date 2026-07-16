/**
 * PORTAL privacy statement — shared copy with soulsort-portal.
 * Keep in sync with soulsort-portal/lib/portal/privacy.ts
 * (soulsort-ai adds the Organizer waitlist section only).
 */

export const PORTAL_PRIVACY_TITLE = "PORTAL — Your privacy, plainly";

export const PORTAL_PRIVACY_CONTACT_EMAIL = "soulsort.ai.official@gmail.com";

export const PORTAL_PRIVACY_SECTIONS: {
  heading?: string;
  paragraphs: string[];
}[] = [
  {
    paragraphs: [
      "PORTAL exists to help people notice how they move through connection, desire, and limits — by dragging scenario cards into four portals: power, desire, community, and safety. That's the only reason we look at how people play, and it's the line we hold every data decision against.",
      "No player account. No name. No email. You play as a randomly generated code, held in a short-lived browser cookie on your device. Our application never stores an IP address alongside your play — see \"Connection data we don't keep\" below.",
      "Event organizers sign in with email to view crowd-level readouts for their event. They never see your individual answers or your personal profile.",
    ],
  },
  {
    heading: "Who's responsible for your data",
    paragraphs: [
      "The event organizer keeps the attendee data they already collect (e.g. name, email, RSVP) — SoulSort never receives it and adds none of its own. PORTAL runs on an anonymous code the organizer mints; we can't connect your play to your identity, and neither can they. The only sensitive-category processing PORTAL involves — how you move through the game — sits with us, under the explicit consent you give before playing, never with the organizer. So PORTAL adds no new personal-data burden to the organizer's side.",
    ],
  },
  {
    heading: "You can disappear",
    paragraphs: [
      "Close the tab and your anonymous code is gone from your device. The profile on your screen disappears when you close the tab — screenshot anything you want to keep; we can't send it to you, because we don't know who you are.",
      "To play, you must opt in to building a personal profile from how you move (see below). Those gesture rows and your computed profile are stored on our servers under that anonymous code. Today they stay until you delete them or ask us to remove them (see Legal basis). We're building automatic deletion so individual rows are removed after they're no longer needed for your profile; only anonymous aggregate patterns from players who opted into community research may remain, and those can't be traced back to you.",
      "On your profile screen, a red \"Delete my data\" button permanently removes your stored play data. That action is irrevocable.",
      "We will never sell your individual data — not to advertisers, not to anyone. That's permanent.",
      "We may, one day, share aggregate, anonymised insights (the kind of combined patterns described below) with research partners — but only where it can't be traced to any person, and never with anyone whose purpose conflicts with why PORTAL exists: we will not hand behavioural desire data to surveillance, profiling, military, or adtech uses, however it's dressed up. If that ever changes, we'll say so here before it does.",
    ],
  },
  {
    heading: "Cookies and similar technologies",
    paragraphs: [
      "PORTAL uses essential browser storage so the game can run in your session — mainly an httpOnly cookie that ties your browser to your anonymous play code for up to seven days. These are strictly necessary and do not require consent.",
      "Organizer logins use separate Supabase session cookies on the same site; those apply only to dashboard access, not to anonymous play.",
      "PORTAL does not currently use optional analytics cookies or visit-source tracking. If we add that later, we'll ask first and update this page.",
    ],
  },
  {
    heading: "Connection data we don't keep",
    paragraphs: [
      "We strip identifying connection data (like IP addresses) everywhere we control it: our application never stores an IP alongside your play, and IP visibility is disabled in our hosting logs. Where our infrastructure providers (Vercel, Supabase) retain connection metadata in their own systems, it is never joined to your gameplay and is subject to their standard short retention. In short: no IP is ever stored next to how you played; what remains is isolated provider-level metadata we don't link to you.",
      "When you finish, your event organizer learns that one anonymous player completed — and, once enough people have finished (see k-anonymity below), they see combined crowd patterns built from everyone's landings and timing. They never see your individual card answers, drag paths, or profile read-back.",
      "If you replay the game from your profile, your earlier run is cleared and only your latest finished run counts toward crowd totals. One anonymous player, one completion — not two plays.",
    ],
  },
  {
    heading: "What we record when you play",
    paragraphs: [
      "After you consent, each scenario saves how you moved: where you landed on the field, how long you waited, where you hovered, how your drag path curved, and whether you reversed course. We also store which portal door you chose at the start, whether you're marked as a newcomer for this event, and which organizer event you're playing under.",
      "Practice rounds are not saved. Only the main run counts.",
      "At the end we compute a personal profile — portal gravity, situation reads, growth notes — from those gestures. That profile is shown only to you in the browser and stored under your anonymous code.",
    ],
  },
  {
    heading: "What your organizer sees",
    paragraphs: [
      "Organizers receive two things: a completion signal (one anonymous player finished, and when), and — only after at least twenty people have completed for that event cycle — pre-aggregated crowd statistics.",
      "Those crowd readouts combine everyone's landings, timing, portal mix, situation summaries, and briefing-style takeaways. They are designed so no single player can be identified. Until the twenty-completion floor is met, crowd panels stay hidden.",
      "Row-level security in our database blocks organizers from reading your individual events, profile, or consent log. That wall is enforced in the schema, not just in the app.",
    ],
  },
  {
    heading: "Community research — opt in separately",
    paragraphs: [
      "SoulSort plans to study how people explore connection and limits, in aggregate, and share what we learn with the community. That programme does not exist yet — nothing is published from it today.",
      "If you tick \"Help the research, anonymously,\" you give advance permission for your anonymous completions to join that pooled research when it launches. We record your choice now and keep your data in a separate research-consent bucket so we can honour it later.",
      "This checkbox is optional and separate from playing. You must still opt in to a personal profile to play at all; research is an extra yes on top.",
      "Your choices in practice: profile yes + research unchecked (play and profile only); or profile yes + research checked (also OK for future SoulSort community research). There is no play-without-profile path in the current version of PORTAL.",
      "Your event organizer's crowd dashboard is built from all anonymous completers for that event (with k-anonymity), regardless of the research checkbox. The research bucket is for SoulSort's own future aggregate work — not shown to organizers.",
      "We only ever report patterns across enough players that no individual can be singled out — never thin slices that could point to one person.",
    ],
  },
  {
    heading: "What the aggregate patterns include",
    paragraphs: [
      "From completers in an organizer's event (crowd dashboard, k-anonymity floor):",
      "Where cards land across the four portals — power, desire, community, safety — so organizers can read the room.",
      "How long people take to decide and drag. Hesitation vs. snap landings feed ideas like comfort zone vs. uncharted territory.",
      "Situation and category groupings — boundaries, connection, play, the work — each tagged in the scenario library, not guessed about your identity.",
      "Consent-read scenarios — whether the crowd's landings matched room-attuned portals — as a group score, never per person in the organizer view.",
      "Newcomer vs. returner mix when that flag is set for the session.",
      "PORTAL is queer-first and consent-first: built by the community, for the community, sharing what we learn as openly as we can.",
    ],
  },
  {
    heading: "Your personal profile (required to play)",
    paragraphs: [
      "To step through, you must tick \"Build my profile from how I play.\" PORTAL reads how you move and builds a private profile just for you — portal gravity, where you showed up, where you can grow. It's never shared with other players, organizers, or published. Without that opt-in, the game won't run.",
    ],
  },
  {
    heading: "Organizer waitlist (this website)",
    paragraphs: [
      "If you join the pilot waitlist on soulsortai.com, we store your email separately from PORTAL gameplay infrastructure, under a legitimate-interest basis for pilot outreach. That data is not linked to anonymous play codes.",
    ],
  },
  {
    heading: "Legal basis (short version)",
    paragraphs: [
      "Gestures about connection, desire, and limits are sensitive data under GDPR Article 9. We store per-player events and profiles only when you explicitly opt in to a personal profile (required to play). Community research uses a separate checkbox, logged in our consent log and bucketed for future use. Running the game, your session cookie, completion signals, and anonymous crowd stats rely on what's needed to deliver the service. Withdraw any time by closing the tab; delete stored rows with the red button on your profile screen, or email soulsort.ai.official@gmail.com if your session cookie is gone.",
    ],
  },
];
