-- Migration: Add requester assessment events and traces for analytics
-- Privacy-first: NO raw text stored, only metadata and derived vectors

-- Requester assessment events (for funnel tracking)
CREATE TABLE IF NOT EXISTS public.requester_assessment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link_id TEXT NOT NULL REFERENCES public.user_links(link_id) ON DELETE CASCADE,
  requester_session_id TEXT, -- references requester_sessions.session_token (TEXT)
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'abandoned')),
  consent_opt_in BOOLEAN DEFAULT false, -- requester consent for analytics
  analytics_opt_in BOOLEAN DEFAULT false, -- requester consent for vector storage
  model_version TEXT,
  scoring_version TEXT,
  schema_version INTEGER DEFAULT 1
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_requester_events_link_id ON public.requester_assessment_events(link_id);
CREATE INDEX IF NOT EXISTS idx_requester_events_created_at ON public.requester_assessment_events(created_at);
CREATE INDEX IF NOT EXISTS idx_requester_events_status ON public.requester_assessment_events(status);
CREATE INDEX IF NOT EXISTS idx_requester_events_analytics_opt_in ON public.requester_assessment_events(analytics_opt_in);

-- Requester assessment traces (QC data, only if analytics_opt_in = true)
-- Stores derived vectors, NO raw text
CREATE TABLE IF NOT EXISTS public.requester_assessment_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link_id TEXT NOT NULL REFERENCES public.user_links(link_id) ON DELETE CASCADE,
  requester_session_id TEXT, -- references requester_sessions.session_token (TEXT)
  analytics_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Derived radar (7 dimensions, 0-100)
  radar JSONB NOT NULL, -- { self_transcendence, self_enhancement, rooting, searching, relational, erotic, consent }
  
  -- Versioning
  model_version TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  schema_version INTEGER NOT NULL DEFAULT 1,
  
  -- Abuse detection
  abuse_flags TEXT[] DEFAULT '{}',
  low_engagement BOOLEAN DEFAULT false,
  
  -- Optional cost tracking
  openai_usage_id UUID REFERENCES public.openai_usage(id) ON DELETE SET NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_requester_traces_link_id ON public.requester_assessment_traces(link_id);
CREATE INDEX IF NOT EXISTS idx_requester_traces_created_at ON public.requester_assessment_traces(created_at);
CREATE INDEX IF NOT EXISTS idx_requester_traces_analytics_opt_in ON public.requester_assessment_traces(analytics_opt_in);
CREATE INDEX IF NOT EXISTS idx_requester_traces_low_engagement ON public.requester_assessment_traces(low_engagement);

-- RLS: Only service role can write, admin can read via API
ALTER TABLE public.requester_assessment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requester_assessment_traces ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access events" ON public.requester_assessment_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access traces" ON public.requester_assessment_traces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- No public access
CREATE POLICY "No public access events" ON public.requester_assessment_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No public access traces" ON public.requester_assessment_traces
  FOR ALL
  USING (false)
  WITH CHECK (false);

