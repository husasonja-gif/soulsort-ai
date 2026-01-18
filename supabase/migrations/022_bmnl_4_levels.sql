-- Migration to update BMNL schema to use 4 levels instead of 3
-- Run this after 021_bmnl_schema.sql if you already have the tables

-- Update bmnl_radar_profiles to support 4 levels
ALTER TABLE public.bmnl_radar_profiles
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_participation_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_consent_literacy_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_communal_responsibility_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_inclusion_awareness_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_self_regulation_check,
  DROP CONSTRAINT IF EXISTS bmnl_radar_profiles_openness_to_learning_check;

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

-- Update bmnl_signals to support 4 levels
ALTER TABLE public.bmnl_signals
  DROP CONSTRAINT IF EXISTS bmnl_signals_signal_level_check;

ALTER TABLE public.bmnl_signals
  ADD CONSTRAINT bmnl_signals_signal_level_check 
    CHECK (signal_level IN ('low', 'emerging', 'stable', 'mastering'));

-- Migrate existing data: medium -> emerging, high -> stable (conservative migration)
UPDATE public.bmnl_radar_profiles
SET 
  participation = CASE 
    WHEN participation = 'medium' THEN 'emerging'
    WHEN participation = 'high' THEN 'stable'
    ELSE participation
  END,
  consent_literacy = CASE 
    WHEN consent_literacy = 'medium' THEN 'emerging'
    WHEN consent_literacy = 'high' THEN 'stable'
    ELSE consent_literacy
  END,
  communal_responsibility = CASE 
    WHEN communal_responsibility = 'medium' THEN 'emerging'
    WHEN communal_responsibility = 'high' THEN 'stable'
    ELSE communal_responsibility
  END,
  inclusion_awareness = CASE 
    WHEN inclusion_awareness = 'medium' THEN 'emerging'
    WHEN inclusion_awareness = 'high' THEN 'stable'
    ELSE inclusion_awareness
  END,
  self_regulation = CASE 
    WHEN self_regulation = 'medium' THEN 'emerging'
    WHEN self_regulation = 'high' THEN 'stable'
    ELSE self_regulation
  END,
  openness_to_learning = CASE 
    WHEN openness_to_learning = 'medium' THEN 'emerging'
    WHEN openness_to_learning = 'high' THEN 'stable'
    ELSE openness_to_learning
  END;

UPDATE public.bmnl_signals
SET signal_level = CASE 
  WHEN signal_level = 'medium' THEN 'emerging'
  WHEN signal_level = 'high' THEN 'stable'
  ELSE signal_level
END;



