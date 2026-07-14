"use client";

import { useState } from "react";

export function OrganizerWaitlistForm({ id = "organizers" }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please confirm you agree to be contacted about PORTAL pilots.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "organizer_pilot" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--panel)] p-6 text-center">
        <p className="font-data text-sm text-[var(--accent)]">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We&apos;ll reach out about bringing PORTAL to your space.
        </p>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          Work email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourclub.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[48px] flex-1 rounded-lg border border-[var(--border)] bg-black px-4 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 font-data text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Join pilot waitlist"}
        </button>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 min-h-[16px] min-w-[16px] accent-[var(--accent)]"
        />
        <span>
          I agree to be contacted about SoulSort PORTAL pilots. Organizer email is stored
          separately from gameplay data — see our{" "}
          <a href="/privacy" className="text-[var(--accent)] underline">
            privacy statement
          </a>
          .
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
