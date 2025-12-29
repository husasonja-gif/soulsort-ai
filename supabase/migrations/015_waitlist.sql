-- Waitlist table for email collection
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT, -- 'homepage', 'dashboard', etc.
  subscribed BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- RLS: Only service role can write, admin can read
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.waitlist
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- No public access
CREATE POLICY "No public access" ON public.waitlist
  FOR ALL
  USING (false)
  WITH CHECK (false);

