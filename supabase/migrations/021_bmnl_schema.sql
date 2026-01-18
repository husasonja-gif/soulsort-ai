-- SoulSort v2: Burning Man Netherlands Schema
-- Cultural onboarding and safety filtering system
-- GDPR-compliant with 6-month data retention

-- ============================================================================
-- BM NL PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Assessment status
  consent_granted_at TIMESTAMPTZ,
  assessment_started_at TIMESTAMPTZ,
  assessment_completed_at TIMESTAMPTZ,
  
  -- GDPR: Automatic deletion on 30 July 2026
  auto_delete_at TIMESTAMPTZ NOT NULL DEFAULT '2026-07-30 23:59:59+00'::timestamptz,
  manually_deleted_at TIMESTAMPTZ,
  
  -- Status flags
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'flagged', 'deleted')),
  needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
  review_notes TEXT,
  
  -- Magic link auth (no password)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bmnl_participants_email ON public.bmnl_participants(email);
CREATE INDEX IF NOT EXISTS idx_bmnl_participants_status ON public.bmnl_participants(status);
CREATE INDEX IF NOT EXISTS idx_bmnl_participants_needs_review ON public.bmnl_participants(needs_human_review);
CREATE INDEX IF NOT EXISTS idx_bmnl_participants_auto_delete ON public.bmnl_participants(auto_delete_at);

-- ============================================================================
-- BM NL ASSESSMENT ANSWERS (RAW - GDPR compliant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.bmnl_participants(id) ON DELETE CASCADE,
  
  -- Question metadata
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 11),
  question_text TEXT NOT NULL,
  
  -- Raw answer (stored for GDPR access rights)
  raw_answer TEXT NOT NULL,
  
  -- Timestamps
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Sensitive data flag (sexuality, gender identity, phobia-related)
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Encryption at rest (application-level, mark sensitive fields)
  encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE(participant_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_bmnl_answers_participant ON public.bmnl_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_bmnl_answers_question ON public.bmnl_answers(question_number);

-- ============================================================================
-- BM NL RADAR PROFILES (Non-numeric: low/emerging/stable/mastering - 4 levels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_radar_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.bmnl_participants(id) ON DELETE CASCADE,
  
  -- 6 axes, each: 'low', 'emerging', 'stable', 'mastering' (4 levels)
  participation TEXT NOT NULL CHECK (participation IN ('low', 'emerging', 'stable', 'mastering')),
  consent_literacy TEXT NOT NULL CHECK (consent_literacy IN ('low', 'emerging', 'stable', 'mastering')),
  communal_responsibility TEXT NOT NULL CHECK (communal_responsibility IN ('low', 'emerging', 'stable', 'mastering')),
  inclusion_awareness TEXT NOT NULL CHECK (inclusion_awareness IN ('low', 'emerging', 'stable', 'mastering')),
  self_regulation TEXT NOT NULL CHECK (self_regulation IN ('low', 'emerging', 'stable', 'mastering')),
  openness_to_learning TEXT NOT NULL CHECK (openness_to_learning IN ('low', 'emerging', 'stable', 'mastering')),
  
  -- Status determination
  gate_experience TEXT NOT NULL CHECK (gate_experience IN ('basic', 'needs_orientation')),
  
  -- Versioning
  schema_version INTEGER NOT NULL DEFAULT 2,
  model_version TEXT NOT NULL DEFAULT 'v2-bmnl',
  scoring_version TEXT NOT NULL DEFAULT 'v2',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(participant_id)
);

CREATE INDEX IF NOT EXISTS idx_bmnl_radar_participant ON public.bmnl_radar_profiles(participant_id);

-- ============================================================================
-- BM NL SIGNAL EXTRACTION (LLM output, before aggregation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.bmnl_participants(id) ON DELETE CASCADE,
  
  -- Per-question signals
  question_number INTEGER NOT NULL,
  signal_level TEXT NOT NULL CHECK (signal_level IN ('low', 'emerging', 'stable', 'mastering')),
  
  -- Flags
  is_garbage BOOLEAN NOT NULL DEFAULT FALSE,
  is_gaming BOOLEAN NOT NULL DEFAULT FALSE,
  is_phobic BOOLEAN NOT NULL DEFAULT FALSE,
  is_defensive BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Which axes this question maps to (JSON array)
  mapped_axes JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- LLM reasoning (optional, for human review)
  llm_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(participant_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_bmnl_signals_participant ON public.bmnl_signals(participant_id);
CREATE INDEX IF NOT EXISTS idx_bmnl_signals_flags ON public.bmnl_signals(is_garbage, is_gaming, is_phobic, is_defensive);

-- ============================================================================
-- BM NL FLAGS (For organizer review)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.bmnl_participants(id) ON DELETE CASCADE,
  
  flag_type TEXT NOT NULL CHECK (flag_type IN ('garbage', 'gaming', 'phobic', 'defensive', 'other')),
  flag_reason TEXT NOT NULL,
  question_number INTEGER,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  
  -- Human review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT CHECK (review_decision IN ('no_action', 'gate_conversation', 'education_required', 'follow_up')),
  review_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bmnl_flags_participant ON public.bmnl_flags(participant_id);
CREATE INDEX IF NOT EXISTS idx_bmnl_flags_reviewed ON public.bmnl_flags(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_bmnl_flags_type ON public.bmnl_flags(flag_type);

-- ============================================================================
-- BM NL CONSENT LOG (GDPR compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.bmnl_participants(id) ON DELETE CASCADE,
  
  consent_type TEXT NOT NULL CHECK (consent_type IN ('assessment', 'data_processing', 'human_review')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  -- GDPR metadata
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT, -- What they consented to
  
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_bmnl_consent_participant ON public.bmnl_consent_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_bmnl_consent_type ON public.bmnl_consent_log(consent_type);

-- ============================================================================
-- BM NL ORGANIZER ACCESS (Who can view organizer dashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bmnl_organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'gate_staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(email)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Drop existing policies if they exist (to allow re-running the schema)
DROP POLICY IF EXISTS "Participants can view own profile" ON public.bmnl_participants;
DROP POLICY IF EXISTS "Participants can view own answers" ON public.bmnl_answers;
DROP POLICY IF EXISTS "Participants can view own radar" ON public.bmnl_radar_profiles;
DROP POLICY IF EXISTS "Organizers can view all participants" ON public.bmnl_participants;
DROP POLICY IF EXISTS "Service role full access participants" ON public.bmnl_participants;
DROP POLICY IF EXISTS "Service role full access answers" ON public.bmnl_answers;
DROP POLICY IF EXISTS "Service role full access radar" ON public.bmnl_radar_profiles;
DROP POLICY IF EXISTS "Service role full access signals" ON public.bmnl_signals;
DROP POLICY IF EXISTS "Service role full access flags" ON public.bmnl_flags;

-- Participants can only see their own data
ALTER TABLE public.bmnl_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own profile"
  ON public.bmnl_participants FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Answers: participants can view their own
ALTER TABLE public.bmnl_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own answers"
  ON public.bmnl_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bmnl_participants
      WHERE bmnl_participants.id = bmnl_answers.participant_id
        AND bmnl_participants.auth_user_id = auth.uid()
    )
  );

-- Radar: participants can view their own
ALTER TABLE public.bmnl_radar_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own radar"
  ON public.bmnl_radar_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bmnl_participants
      WHERE bmnl_participants.id = bmnl_radar_profiles.participant_id
        AND bmnl_participants.auth_user_id = auth.uid()
    )
  );

-- Organizers can view all (via service role or explicit policy)
ALTER TABLE public.bmnl_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can view all participants"
  ON public.bmnl_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bmnl_organizers
      WHERE bmnl_organizers.user_id = auth.uid()
    )
  );

-- Service role has full access (for API operations)
CREATE POLICY "Service role full access participants"
  ON public.bmnl_participants FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access answers"
  ON public.bmnl_answers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access radar"
  ON public.bmnl_radar_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access signals"
  ON public.bmnl_signals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access flags"
  ON public.bmnl_flags FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- AUTOMATIC DELETION FUNCTION (GDPR: 6-month retention)
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_delete_bmnl_data()
RETURNS void AS $$
BEGIN
  -- Delete all data for participants past auto_delete_at
  DELETE FROM public.bmnl_answers
  WHERE participant_id IN (
    SELECT id FROM public.bmnl_participants
    WHERE auto_delete_at < NOW()
      AND manually_deleted_at IS NULL
  );
  
  DELETE FROM public.bmnl_radar_profiles
  WHERE participant_id IN (
    SELECT id FROM public.bmnl_participants
    WHERE auto_delete_at < NOW()
      AND manually_deleted_at IS NULL
  );
  
  DELETE FROM public.bmnl_signals
  WHERE participant_id IN (
    SELECT id FROM public.bmnl_participants
    WHERE auto_delete_at < NOW()
      AND manually_deleted_at IS NULL
  );
  
  DELETE FROM public.bmnl_flags
  WHERE participant_id IN (
    SELECT id FROM public.bmnl_participants
    WHERE auto_delete_at < NOW()
      AND manually_deleted_at IS NULL
  );
  
  DELETE FROM public.bmnl_consent_log
  WHERE participant_id IN (
    SELECT id FROM public.bmnl_participants
    WHERE auto_delete_at < NOW()
      AND manually_deleted_at IS NULL
  );
  
  -- Mark participants as deleted
  UPDATE public.bmnl_participants
  SET status = 'deleted',
      manually_deleted_at = NOW()
  WHERE auto_delete_at < NOW()
    AND manually_deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
