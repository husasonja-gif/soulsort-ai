-- ============================================================================
-- COMPLETE SOULSORT AI DATABASE SCHEMA
-- ============================================================================
-- This is a complete, idempotent migration that combines all migrations
-- Safe to run multiple times - drops indexes/policies before creating them

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- BASE SCHEMA (001)
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  UNIQUE(email)
);

-- Add preferences column if it doesn't exist
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Consent ledger (GDPR compliance)
CREATE TABLE IF NOT EXISTS public.consent_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('public_radar', 'analytics', 'data_processing')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User radar profiles (vector data only, no raw questions)
CREATE TABLE IF NOT EXISTS public.user_radar_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Radar dimensions (0-100 scale)
  self_transcendence INTEGER NOT NULL CHECK (self_transcendence >= 0 AND self_transcendence <= 100),
  self_enhancement INTEGER NOT NULL CHECK (self_enhancement >= 0 AND self_enhancement <= 100),
  rooting INTEGER NOT NULL CHECK (rooting >= 0 AND rooting <= 100),
  searching INTEGER NOT NULL CHECK (searching >= 0 AND searching <= 100),
  relational INTEGER NOT NULL CHECK (relational >= 0 AND relational <= 100),
  erotic INTEGER NOT NULL CHECK (erotic >= 0 AND erotic <= 100),
  consent_dim INTEGER NOT NULL CHECK (consent_dim >= 0 AND consent_dim <= 100),
  
  -- Vector representation (for analytics, anonymized)
  vector_embedding VECTOR(1536), -- OpenAI embedding dimension
  
  -- Versioning
  schema_version INTEGER NOT NULL DEFAULT 1,
  model_version TEXT NOT NULL DEFAULT 'v1',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  
  -- Dealbreakers (stored as JSON array of strings)
  dealbreakers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Personalized links for requesters
CREATE TABLE IF NOT EXISTS public.user_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, link_id)
);

-- Requester assessments (no raw questions stored)
CREATE TABLE IF NOT EXISTS public.requester_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id TEXT NOT NULL REFERENCES public.user_links(link_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Only vector data stored, no raw responses
  vector_embedding VECTOR(1536),
  
  -- Radar dimensions (computed from assessment)
  self_transcendence INTEGER NOT NULL CHECK (self_transcendence >= 0 AND self_transcendence <= 100),
  self_enhancement INTEGER NOT NULL CHECK (self_enhancement >= 0 AND self_enhancement <= 100),
  rooting INTEGER NOT NULL CHECK (rooting >= 0 AND rooting <= 100),
  searching INTEGER NOT NULL CHECK (searching >= 0 AND searching <= 100),
  relational INTEGER NOT NULL CHECK (relational >= 0 AND relational <= 100),
  erotic INTEGER NOT NULL CHECK (erotic >= 0 AND erotic <= 100),
  consent_dim INTEGER NOT NULL CHECK (consent_dim >= 0 AND consent_dim <= 100),
  
  -- Compatibility score (0-100)
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  
  -- LLM-generated summary (text only, no raw data)
  summary_text TEXT,
  
  -- Versioning
  schema_version INTEGER NOT NULL DEFAULT 1,
  model_version TEXT NOT NULL DEFAULT 'v1',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  
  -- Abuse detection flags
  abuse_flags JSONB DEFAULT '[]'::jsonb,
  
  -- Dealbreaker hits (private to profile owner)
  dealbreaker_hits JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics archetype fingerprints (anonymized, aggregated)
CREATE TABLE IF NOT EXISTS public.archetype_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archetype_name TEXT NOT NULL,
  vector_centroid VECTOR(1536) NOT NULL,
  radar_profile JSONB NOT NULL, -- Average radar dimensions for this archetype
  sample_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(archetype_name)
);

-- ============================================================================
-- DROP ALL INDEXES FIRST (for idempotency)
-- ============================================================================
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_consent_ledger_user_id;
DROP INDEX IF EXISTS idx_user_radar_profiles_user_id;
DROP INDEX IF EXISTS idx_user_links_link_id;
DROP INDEX IF EXISTS idx_user_links_user_id;
DROP INDEX IF EXISTS idx_requester_assessments_link_id;
DROP INDEX IF EXISTS idx_requester_assessments_user_id;
DROP INDEX IF EXISTS idx_analytics_events_user_id;
DROP INDEX IF EXISTS idx_analytics_events_type;
DROP INDEX IF EXISTS idx_analytics_events_created_at;
DROP INDEX IF EXISTS idx_requester_sessions_link_id;
DROP INDEX IF EXISTS idx_requester_sessions_requester_id;
DROP INDEX IF EXISTS idx_requester_sessions_completed_at;
DROP INDEX IF EXISTS idx_requester_sessions_abandoned_at;
DROP INDEX IF EXISTS idx_share_actions_user_id;
DROP INDEX IF EXISTS idx_share_actions_link_id;
DROP INDEX IF EXISTS idx_share_actions_created_at;
DROP INDEX IF EXISTS idx_openai_usage_user_id;
DROP INDEX IF EXISTS idx_openai_usage_endpoint;
DROP INDEX IF EXISTS idx_openai_usage_created_at;
DROP INDEX IF EXISTS idx_openai_usage_success;
DROP INDEX IF EXISTS idx_vector_analytics_user_id;
DROP INDEX IF EXISTS idx_vector_analytics_created_at;
DROP INDEX IF EXISTS idx_dashboard_visits_user_id;
DROP INDEX IF EXISTS idx_dashboard_visits_visit_date;
DROP INDEX IF EXISTS idx_profile_traces_created_at;
DROP INDEX IF EXISTS idx_profile_traces_user_id;
DROP INDEX IF EXISTS idx_profile_traces_low_evidence;
DROP INDEX IF EXISTS idx_profile_traces_model_version;

-- ============================================================================
-- CREATE BASE SCHEMA INDEXES
-- ============================================================================
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_consent_ledger_user_id ON public.consent_ledger(user_id);
CREATE INDEX idx_user_radar_profiles_user_id ON public.user_radar_profiles(user_id);
CREATE INDEX idx_user_links_link_id ON public.user_links(link_id);
CREATE INDEX idx_user_links_user_id ON public.user_links(user_id);
CREATE INDEX idx_requester_assessments_link_id ON public.requester_assessments(link_id);
CREATE INDEX idx_requester_assessments_user_id ON public.requester_assessments(user_id);

-- ============================================================================
-- ANALYTICS SCHEMA (013)
-- ============================================================================

-- Analytics Events Table
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

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Requester Sessions
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

CREATE INDEX idx_requester_sessions_link_id ON requester_sessions(link_id);
CREATE INDEX idx_requester_sessions_requester_id ON requester_sessions(requester_id);
CREATE INDEX idx_requester_sessions_completed_at ON requester_sessions(completed_at);
CREATE INDEX idx_requester_sessions_abandoned_at ON requester_sessions(abandoned_at);

-- Share Actions
CREATE TABLE IF NOT EXISTS share_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL REFERENCES user_links(link_id) ON DELETE CASCADE,
  share_method TEXT,
  share_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_actions_user_id ON share_actions(user_id);
CREATE INDEX idx_share_actions_link_id ON share_actions(link_id);
CREATE INDEX idx_share_actions_created_at ON share_actions(created_at);

-- OpenAI Usage
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

CREATE INDEX idx_openai_usage_user_id ON openai_usage(user_id);
CREATE INDEX idx_openai_usage_endpoint ON openai_usage(endpoint);
CREATE INDEX idx_openai_usage_created_at ON openai_usage(created_at);
CREATE INDEX idx_openai_usage_success ON openai_usage(success);

-- Vector Analytics
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

CREATE INDEX idx_vector_analytics_user_id ON vector_analytics(user_id);
CREATE INDEX idx_vector_analytics_created_at ON vector_analytics(created_at);

-- Dashboard Visits
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
-- PROFILE GENERATION TRACES (014)
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

-- Add boundaries columns if they don't exist (for boundaries scale v2)
ALTER TABLE public.profile_generation_traces
  ADD COLUMN IF NOT EXISTS boundaries_raw INTEGER,
  ADD COLUMN IF NOT EXISTS boundaries_ease INTEGER,
  ADD COLUMN IF NOT EXISTS boundaries_scale_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS boundaries_ease_unified INTEGER;

CREATE INDEX idx_profile_traces_created_at ON public.profile_generation_traces(created_at);
CREATE INDEX idx_profile_traces_user_id ON public.profile_generation_traces(user_id);
CREATE INDEX idx_profile_traces_low_evidence ON public.profile_generation_traces(low_evidence);
CREATE INDEX idx_profile_traces_model_version ON public.profile_generation_traces(model_version);

-- Add index for boundaries_scale_version (after columns are added)
DROP INDEX IF EXISTS idx_profile_traces_boundaries_scale_version;
CREATE INDEX idx_profile_traces_boundaries_scale_version 
  ON public.profile_generation_traces(boundaries_scale_version);

-- Add index for preferences (after column is added)
DROP INDEX IF EXISTS idx_user_profiles_preferences;
CREATE INDEX idx_user_profiles_preferences 
  ON public.user_profiles USING gin(preferences);

-- ============================================================================
-- ROW LEVEL SECURITY - BASE SCHEMA
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_radar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requester_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_fingerprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_ledger;
DROP POLICY IF EXISTS "Users can insert own consent" ON public.consent_ledger;
DROP POLICY IF EXISTS "Users can view own radar" ON public.user_radar_profiles;
DROP POLICY IF EXISTS "Users can insert own radar" ON public.user_radar_profiles;
DROP POLICY IF EXISTS "Users can update own radar" ON public.user_radar_profiles;
DROP POLICY IF EXISTS "Users can view own links" ON public.user_links;
DROP POLICY IF EXISTS "Users can create own links" ON public.user_links;
DROP POLICY IF EXISTS "Public can view active links by link_id" ON public.user_links;
DROP POLICY IF EXISTS "Users can view assessments for their links" ON public.requester_assessments;
DROP POLICY IF EXISTS "Anyone can insert assessments for active links" ON public.requester_assessments;
DROP POLICY IF EXISTS "Anyone can view archetypes" ON public.archetype_fingerprints;

-- Create base schema policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own consent" ON public.consent_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent" ON public.consent_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own radar" ON public.user_radar_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.consent_ledger cl
      WHERE cl.user_id = user_radar_profiles.user_id
        AND cl.consent_type = 'public_radar'
        AND cl.granted = TRUE
        AND cl.revoked_at IS NULL
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.user_id = user_radar_profiles.user_id
        AND ul.is_active = true
    )
  );

CREATE POLICY "Users can insert own radar" ON public.user_radar_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own radar" ON public.user_radar_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own links" ON public.user_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own links" ON public.user_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active links by link_id" ON public.user_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view assessments for their links" ON public.requester_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert assessments for active links" ON public.requester_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.is_active = true
    )
  );

CREATE POLICY "Anyone can view archetypes" ON public.archetype_fingerprints
  FOR SELECT USING (true);

-- ============================================================================
-- ROW LEVEL SECURITY - ANALYTICS SCHEMA
-- ============================================================================

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE requester_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_generation_traces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view requester sessions for their links" ON requester_sessions;
DROP POLICY IF EXISTS "Users can view their own share actions" ON share_actions;
DROP POLICY IF EXISTS "Users can view their own OpenAI usage" ON openai_usage;
DROP POLICY IF EXISTS "Users can view their own vector analytics" ON vector_analytics;
DROP POLICY IF EXISTS "Users can view their own dashboard visits" ON dashboard_visits;
DROP POLICY IF EXISTS "Service role full access" ON public.profile_generation_traces;
DROP POLICY IF EXISTS "No public access" ON public.profile_generation_traces;

-- Create analytics policies
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
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_user_radar_profiles_updated_at ON public.user_radar_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS enforce_analytics_consent ON vector_analytics;

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_radar_profiles_updated_at
  BEFORE UPDATE ON public.user_radar_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Function to check analytics consent
DROP FUNCTION IF EXISTS check_analytics_consent();
CREATE FUNCTION check_analytics_consent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce if user_consents table exists (or consent_ledger)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consent_ledger') THEN
    IF NOT EXISTS (
      SELECT 1 FROM consent_ledger
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

CREATE TRIGGER enforce_analytics_consent
  BEFORE INSERT ON vector_analytics
  FOR EACH ROW
  EXECUTE FUNCTION check_analytics_consent();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN requester_assessments.dealbreaker_hits IS 'Private dealbreaker hits (JSON array) visible only to profile owner. Never exposed to requester.';

