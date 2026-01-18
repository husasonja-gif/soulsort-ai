-- Fix BMNL constraints - clear test data and set up 4-level constraints
-- Since this is pre-production, we can safely clear test data

-- STEP 1: Drop all existing constraints (by name and dynamically)
ALTER TABLE public.bmnl_radar_profiles
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_participation_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_consent_literacy_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_communal_responsibility_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_inclusion_awareness_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_self_regulation_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_openness_to_learning_check;

ALTER TABLE public.bmnl_signals
  DROP CONSTRAINT IF EXISTS bmnl_signals_signal_level_check;

-- Drop any remaining constraints dynamically
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all check constraints on bmnl_radar_profiles
    FOR r IN (
        SELECT conname, conrelid::regclass
        FROM pg_constraint
        WHERE conrelid = 'public.bmnl_radar_profiles'::regclass
        AND contype = 'c'
        AND (
            conname LIKE '%participation%' OR
            conname LIKE '%consent_literacy%' OR
            conname LIKE '%communal_responsibility%' OR
            conname LIKE '%inclusion_awareness%' OR
            conname LIKE '%self_regulation%' OR
            conname LIKE '%openness_to_learning%'
        )
    ) LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.conrelid, r.conname);
    END LOOP;
    
    -- Drop all check constraints on bmnl_signals signal_level
    FOR r IN (
        SELECT conname, conrelid::regclass
        FROM pg_constraint
        WHERE conrelid = 'public.bmnl_signals'::regclass
        AND contype = 'c'
        AND conname LIKE '%signal_level%'
    ) LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.conrelid, r.conname);
    END LOOP;
END $$;

-- STEP 2: Clear all test data (since we're pre-production)
TRUNCATE TABLE public.bmnl_signals CASCADE;
TRUNCATE TABLE public.bmnl_radar_profiles CASCADE;
TRUNCATE TABLE public.bmnl_answers CASCADE;
TRUNCATE TABLE public.bmnl_flags CASCADE;
-- Note: We don't truncate bmnl_participants or bmnl_consent_log to preserve structure

-- STEP 3: Add the correct 4-level constraints to bmnl_radar_profiles
ALTER TABLE public.bmnl_radar_profiles
  ADD CONSTRAINT bmnl_radar_profiles_participation_check 
    CHECK (participation IN ('low', 'emerging', 'stable', 'mastering')),
  ADD CONSTRAINT bmnl_radar_profiles_consent_literacy_check 
    CHECK (consent_literacy IN ('low', 'emerging', 'stable', 'mastering')),
  ADD CONSTRAINT bmnl_radar_profiles_communal_responsibility_check 
    CHECK (communal_responsibility IN ('low', 'emerging', 'stable', 'mastering')),
  ADD CONSTRAINT bmnl_radar_profiles_inclusion_awareness_check 
    CHECK (inclusion_awareness IN ('low', 'emerging', 'stable', 'mastering')),
  ADD CONSTRAINT bmnl_radar_profiles_self_regulation_check 
    CHECK (self_regulation IN ('low', 'emerging', 'stable', 'mastering')),
  ADD CONSTRAINT bmnl_radar_profiles_openness_to_learning_check 
    CHECK (openness_to_learning IN ('low', 'emerging', 'stable', 'mastering'));

-- STEP 4: Add the correct 4-level constraint to bmnl_signals
ALTER TABLE public.bmnl_signals
  ADD CONSTRAINT bmnl_signals_signal_level_check 
    CHECK (signal_level IN ('low', 'emerging', 'stable', 'mastering'));
