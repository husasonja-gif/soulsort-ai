-- Profile Generation Traces Table
-- Stores QC data for analytics (NO raw text, only numbers and metadata)

CREATE TABLE IF NOT EXISTS public.profile_generation_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  link_id TEXT, -- nullable, references user_links.link_id (TEXT type)
  
  -- Version tracking
  model_version TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  schema_version INTEGER NOT NULL DEFAULT 1,
  
  -- Slider values (0-100)
  pace INTEGER,
  connection_chemistry INTEGER,
  vanilla_kinky INTEGER,
  open_monogamous INTEGER,
  boundaries INTEGER,
  
  -- Base priors (computed from sliders)
  base_priors JSONB NOT NULL,
  
  -- Deltas from LLM
  deltas JSONB, -- { values_delta, erotic_delta, relational_delta, consent_delta, gaming_detected? }
  
  -- Final vectors (after applying deltas)
  final_vectors JSONB NOT NULL, -- { values_vector, erotic_vector, relational_vector, consent_vector }
  
  -- Extraction QC
  extraction_status JSONB NOT NULL, -- { q1: "found"|"missing", q2:..., q3:..., q4... }
  answer_word_counts JSONB NOT NULL, -- { q1: int, q2: int, q3: int, q4: int }
  low_evidence BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_traces_created_at ON public.profile_generation_traces(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_traces_user_id ON public.profile_generation_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_traces_low_evidence ON public.profile_generation_traces(low_evidence);
CREATE INDEX IF NOT EXISTS idx_profile_traces_model_version ON public.profile_generation_traces(model_version);

-- RLS: Only service role can write, admin can read via API
ALTER TABLE public.profile_generation_traces ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.profile_generation_traces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- No public access
CREATE POLICY "No public access" ON public.profile_generation_traces
  FOR ALL
  USING (false)
  WITH CHECK (false);




