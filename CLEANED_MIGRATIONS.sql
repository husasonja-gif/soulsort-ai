-- ============================================================================
-- CLEANED MIGRATION SQL - Run this in Supabase SQL Editor
-- ============================================================================
-- This combines migrations 013 and 014 with duplicates removed
-- All CREATE INDEX statements use IF NOT EXISTS for idempotency

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'requester_started',
    'requester_completed',
    'requester_abandoned',
    'radar_viewed',
    'share_clicked',
    'dashboard_visited',
    'onboarding_started',
    'onboarding_completed',
    'onboarding_abandoned'
  ))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- ============================================================================
-- REQUester FUNNEL TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS requester_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT NOT NULL REFERENCES user_links(link_id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token TEXT,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_granted_at TIMESTAMPTZ,
  questions_started_at TIMESTAMPTZ,
  questions_completed_at TIMESTAMPTZ,
  assessment_generated_at TIMESTAMPTZ,
  results_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  abandoned_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drop_off_stage TEXT,
  
  completion_time_ms INTEGER,
  questions_answered INTEGER DEFAULT 0,
  questions_skipped INTEGER DEFAULT 0,
  
  converted_to_user BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requester_sessions_link_id ON requester_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_requester_sessions_requester_id ON requester_sessions(requester_id);
CREATE INDEX IF NOT EXISTS idx_requester_sessions_completed_at ON requester_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_requester_sessions_abandoned_at ON requester_sessions(abandoned_at);

-- ============================================================================
-- SHARE ACTIONS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS share_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL REFERENCES user_links(link_id) ON DELETE CASCADE,
  share_method TEXT,
  share_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_actions_user_id ON share_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_share_actions_link_id ON share_actions(link_id);
CREATE INDEX IF NOT EXISTS idx_share_actions_created_at ON share_actions(created_at);

-- ============================================================================
-- OPENAI USAGE TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS openai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id TEXT REFERENCES user_links(link_id) ON DELETE SET NULL,
  requester_session_id UUID REFERENCES requester_sessions(id) ON DELETE SET NULL,
  
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  cost_usd DECIMAL(10, 6) NOT NULL,
  
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  response_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_openai_usage_user_id ON openai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_usage_endpoint ON openai_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_openai_usage_created_at ON openai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_openai_usage_success ON openai_usage(success);

-- ============================================================================
-- VECTOR ANALYTICS (Consent-Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vector_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  radar_profile_id UUID NOT NULL REFERENCES user_radar_profiles(id) ON DELETE CASCADE,
  
  values_vector REAL[] NOT NULL,
  erotic_vector REAL[] NOT NULL,
  relational_vector REAL[] NOT NULL,
  consent_vector REAL[] NOT NULL,
  
  dealbreakers TEXT[],
  preferences JSONB,
  
  schema_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vector_analytics_user_id ON vector_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_vector_analytics_created_at ON vector_analytics(created_at);

-- ============================================================================
-- DASHBOARD VISITS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_visits_user_id ON dashboard_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_visits_visit_date ON dashboard_visits(visit_date);

-- ============================================================================
-- PROFILE GENERATION TRACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_generation_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id TEXT,
  
  model_version TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  schema_version INTEGER NOT NULL DEFAULT 1,
  
  pace INTEGER,
  connection_chemistry INTEGER,
  vanilla_kinky INTEGER,
  open_monogamous INTEGER,
  boundaries INTEGER,
  
  base_priors JSONB NOT NULL,
  deltas JSONB,
  final_vectors JSONB NOT NULL,
  
  extraction_status JSONB NOT NULL,
  answer_word_counts JSONB NOT NULL,
  low_evidence BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_profile_traces_created_at ON public.profile_generation_traces(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_traces_user_id ON public.profile_generation_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_traces_low_evidence ON public.profile_generation_traces(low_evidence);
CREATE INDEX IF NOT EXISTS idx_profile_traces_model_version ON public.profile_generation_traces(model_version);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view requester sessions for their links" ON requester_sessions;
DROP POLICY IF EXISTS "Users can view their own share actions" ON share_actions;
DROP POLICY IF EXISTS "Users can view their own OpenAI usage" ON openai_usage;
DROP POLICY IF EXISTS "Users can view their own vector analytics" ON vector_analytics;
DROP POLICY IF EXISTS "Users can view their own dashboard visits" ON dashboard_visits;
DROP POLICY IF EXISTS "Service role full access" ON public.profile_generation_traces;
DROP POLICY IF EXISTS "No public access" ON public.profile_generation_traces;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE requester_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_generation_traces ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view requester sessions for their links"
  ON requester_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_links
      WHERE user_links.link_id = requester_sessions.link_id
        AND user_links.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own share actions"
  ON share_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own OpenAI usage"
  ON openai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own vector analytics"
  ON vector_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own dashboard visits"
  ON dashboard_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.profile_generation_traces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "No public access" ON public.profile_generation_traces
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FUNCTIONS (with IF NOT EXISTS equivalent - DROP and RECREATE)
-- ============================================================================

-- Function to update last_activity_at on requester_sessions
DROP FUNCTION IF EXISTS update_requester_session_activity();
CREATE FUNCTION update_requester_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE requester_sessions
  SET last_activity_at = NOW()
  WHERE id = NEW.requester_session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track dashboard visits
DROP FUNCTION IF EXISTS track_dashboard_visit();
CREATE FUNCTION track_dashboard_visit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dashboard_visits (user_id, visit_date, visit_count, last_visited_at)
  VALUES (NEW.user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, visit_date)
  DO UPDATE SET
    visit_count = dashboard_visits.visit_count + 1,
    last_visited_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check analytics consent (only if user_consents table exists)
DROP FUNCTION IF EXISTS check_analytics_consent();
CREATE FUNCTION check_analytics_consent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce if user_consents table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_consents
      WHERE user_id = NEW.user_id
        AND consent_type = 'analytics'
        AND granted = TRUE
        AND revoked_at IS NULL
    ) THEN
      RAISE EXCEPTION 'User has not consented to analytics';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for analytics consent (only if function exists)
DROP TRIGGER IF EXISTS enforce_analytics_consent ON vector_analytics;
CREATE TRIGGER enforce_analytics_consent
  BEFORE INSERT ON vector_analytics
  FOR EACH ROW
  EXECUTE FUNCTION check_analytics_consent();




