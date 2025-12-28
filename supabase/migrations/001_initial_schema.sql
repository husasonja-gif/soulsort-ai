-- SoulSort AI Database Schema
-- GDPR-compliant, privacy-first design
-- This migration is idempotent - safe to run multiple times

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (requires pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_consent_ledger_user_id ON public.consent_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_user_radar_profiles_user_id ON public.user_radar_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_links_link_id ON public.user_links(link_id);
CREATE INDEX IF NOT EXISTS idx_user_links_user_id ON public.user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_requester_assessments_link_id ON public.requester_assessments(link_id);
CREATE INDEX IF NOT EXISTS idx_requester_assessments_user_id ON public.requester_assessments(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_radar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requester_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_fingerprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_ledger;
DROP POLICY IF EXISTS "Users can insert own consent" ON public.consent_ledger;

DROP POLICY IF EXISTS "Users can view own radar" ON public.user_radar_profiles;
DROP POLICY IF EXISTS "Users can insert own radar" ON public.user_radar_profiles;
DROP POLICY IF EXISTS "Users can update own radar" ON public.user_radar_profiles;

DROP POLICY IF EXISTS "Users can view own links" ON public.user_links;
DROP POLICY IF EXISTS "Users can create own links" ON public.user_links;

DROP POLICY IF EXISTS "Users can view assessments for their links" ON public.requester_assessments;
DROP POLICY IF EXISTS "Anyone can insert assessments for active links" ON public.requester_assessments;

DROP POLICY IF EXISTS "Anyone can view archetypes" ON public.archetype_fingerprints;

-- User profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Consent ledger: users can only see their own
CREATE POLICY "Users can view own consent" ON public.consent_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent" ON public.consent_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Radar profiles: users can only see their own, or public ones if consent granted
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

-- User links: users can view their own links
CREATE POLICY "Users can view own links" ON public.user_links
  FOR SELECT USING (auth.uid() = user_id);

-- User links: public can view active links by link_id (for requester access)
CREATE POLICY "Public can view active links by link_id" ON public.user_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create own links" ON public.user_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Requester assessments: users can view assessments for their links
CREATE POLICY "Users can view assessments for their links" ON public.requester_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.user_id = auth.uid()
    )
  );

-- Requester assessments: anyone can insert assessments for active links (requesters are anonymous)
CREATE POLICY "Anyone can insert assessments for active links" ON public.requester_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.is_active = true
    )
  );

-- Archetype fingerprints: public read (anonymized data)
CREATE POLICY "Anyone can view archetypes" ON public.archetype_fingerprints
  FOR SELECT USING (true);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_user_radar_profiles_updated_at ON public.user_radar_profiles;

-- Triggers for updated_at
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



