-- Analytics Schema for SoulSort AI
-- Tracks funnel completion, engagement, growth loops, and infrastructure health
-- Privacy-first: No raw text storage, only metadata and vectors (with consent)

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
-- Tracks all user actions and events for funnel analysis
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'requester_started', 'requester_completed', 'radar_viewed', 'share_clicked', etc.
  event_data JSONB, -- Flexible metadata (link_id, completion_time_ms, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
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

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- ============================================================================
-- REQUester FUNNEL TRACKING
-- ============================================================================
-- Tracks requester flow completion and drop-off points
CREATE TABLE IF NOT EXISTS requester_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT NOT NULL REFERENCES user_links(link_id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if anonymous
  session_token TEXT, -- For anonymous tracking
  
  -- Funnel stages
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_granted_at TIMESTAMPTZ,
  questions_started_at TIMESTAMPTZ,
  questions_completed_at TIMESTAMPTZ,
  assessment_generated_at TIMESTAMPTZ,
  results_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Drop-off tracking
  abandoned_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drop_off_stage TEXT, -- 'consent', 'questions', 'assessment', 'results'
  
  -- Metadata
  completion_time_ms INTEGER, -- Total time from start to completion
  questions_answered INTEGER DEFAULT 0,
  questions_skipped INTEGER DEFAULT 0,
  
  -- Growth loop tracking
  converted_to_user BOOLEAN DEFAULT FALSE, -- Did they sign up after seeing results?
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requester_sessions_link_id ON requester_sessions(link_id);
CREATE INDEX idx_requester_sessions_requester_id ON requester_sessions(requester_id);
CREATE INDEX idx_requester_sessions_completed_at ON requester_sessions(completed_at);
CREATE INDEX idx_requester_sessions_abandoned_at ON requester_sessions(abandoned_at);

-- ============================================================================
-- SHARE ACTIONS TRACKING
-- ============================================================================
-- Tracks when users share their radar links (for growth loop analysis)
CREATE TABLE IF NOT EXISTS share_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL REFERENCES user_links(link_id) ON DELETE CASCADE,
  share_method TEXT, -- 'copy_link', 'qr_code', 'png_download', 'social_share'
  share_platform TEXT, -- 'dating_app', 'social_media', 'direct_message', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_actions_user_id ON share_actions(user_id);
CREATE INDEX idx_share_actions_link_id ON share_actions(link_id);
CREATE INDEX idx_share_actions_created_at ON share_actions(created_at);

-- ============================================================================
-- OPENAI USAGE TRACKING
-- ============================================================================
-- Tracks OpenAI API usage for cost analysis and infrastructure health
CREATE TABLE IF NOT EXISTS openai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id TEXT REFERENCES user_links(link_id) ON DELETE SET NULL,
  requester_session_id UUID REFERENCES requester_sessions(id) ON DELETE SET NULL,
  
  -- API call details
  endpoint TEXT NOT NULL, -- 'onboarding_chat', 'generate_profile', 'requester_assess', 'requester_commentary'
  model TEXT NOT NULL, -- 'gpt-4o-mini', etc.
  
  -- Token usage
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- Cost tracking (in USD)
  cost_usd DECIMAL(10, 6) NOT NULL,
  
  -- Metadata
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  response_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_openai_usage_user_id ON openai_usage(user_id);
CREATE INDEX idx_openai_usage_endpoint ON openai_usage(endpoint);
CREATE INDEX idx_openai_usage_created_at ON openai_usage(created_at);
CREATE INDEX idx_openai_usage_success ON openai_usage(success);

-- ============================================================================
-- VECTOR ANALYTICS (Consent-Only)
-- ============================================================================
-- Stores vector data for users who opted into analytics
-- Used for archetype analysis and pattern detection
CREATE TABLE IF NOT EXISTS vector_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  radar_profile_id UUID NOT NULL REFERENCES user_radar_profiles(id) ON DELETE CASCADE,
  
  -- Vector data (only stored if user consented)
  values_vector REAL[] NOT NULL, -- [self_transcendence, self_enhancement, rooting, searching]
  erotic_vector REAL[] NOT NULL, -- 5 dimensions
  relational_vector REAL[] NOT NULL, -- 5 dimensions
  consent_vector REAL[] NOT NULL, -- 4 dimensions
  
  -- Metadata
  dealbreakers TEXT[],
  preferences JSONB, -- {pace, connection_chemistry, etc.}
  
  -- Versioning
  schema_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vector_analytics_user_id ON vector_analytics(user_id);
CREATE INDEX idx_vector_analytics_created_at ON vector_analytics(created_at);

-- Only allow inserts if user has analytics consent
CREATE OR REPLACE FUNCTION check_analytics_consent()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_consents
    WHERE user_id = NEW.user_id
      AND consent_type = 'analytics'
      AND granted = TRUE
      AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User has not consented to analytics';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_analytics_consent
  BEFORE INSERT ON vector_analytics
  FOR EACH ROW
  EXECUTE FUNCTION check_analytics_consent();

-- ============================================================================
-- DASHBOARD VISITS TRACKING
-- ============================================================================
-- Tracks return visits for stickiness metrics
CREATE TABLE IF NOT EXISTS dashboard_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, visit_date)
);

CREATE INDEX idx_dashboard_visits_user_id ON dashboard_visits(user_id);
CREATE INDEX idx_dashboard_visits_visit_date ON dashboard_visits(visit_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Analytics events: Users can only see their own events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Requester sessions: Users can see sessions for their links
ALTER TABLE requester_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view requester sessions for their links"
  ON requester_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_links
      WHERE user_links.link_id = requester_sessions.link_id
        AND user_links.user_id = auth.uid()
    )
  );

-- Share actions: Users can see their own share actions
ALTER TABLE share_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own share actions"
  ON share_actions FOR SELECT
  USING (auth.uid() = user_id);

-- OpenAI usage: Users can see their own usage
ALTER TABLE openai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own OpenAI usage"
  ON openai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Vector analytics: Users can see their own vectors
ALTER TABLE vector_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own vector analytics"
  ON vector_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Dashboard visits: Users can see their own visits
ALTER TABLE dashboard_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own dashboard visits"
  ON dashboard_visits FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update last_activity_at on requester_sessions
CREATE OR REPLACE FUNCTION update_requester_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE requester_sessions
  SET last_activity_at = NOW()
  WHERE id = NEW.requester_session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track dashboard visits
CREATE OR REPLACE FUNCTION track_dashboard_visit()
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

