import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center text-sm text-[var(--muted)]">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          soulsortai.com
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a
            href="mailto:soulsort.ai.official@gmail.com"
            className="hover:text-[var(--foreground)]"
          >
            soulsort.ai.official@gmail.com
          </a>
          <a
            href="https://instagram.com/soulsorts"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)]"
          >
            Instagram · @soulsorts
          </a>
          <a
            href="https://tiktok.com/@soulsorts"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)]"
          >
            TikTok · @soulsorts
          </a>
          <Link href="/privacy" className="hover:text-[var(--foreground)]">
            Privacy statement
          </Link>
          <Link href="/blog" className="hover:text-[var(--foreground)]">
            Blog
          </Link>
        </div>
        <p className="text-xs">© SoulSort · KVK 42049281 · VAT NL005455917B63</p>
      </div>
    </footer>
  );
}
