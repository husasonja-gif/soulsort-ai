-- Fix RLS policy for requester_assessments INSERT
-- The policy should allow inserts when the link exists and is active
-- This migration ensures the policy works correctly for anonymous requesters

DROP POLICY IF EXISTS "Anyone can insert assessments for active links" ON public.requester_assessments;

-- Recreate the policy with explicit check
-- Note: In WITH CHECK clauses, we can reference the NEW row values
CREATE POLICY "Anyone can insert assessments for active links" ON public.requester_assessments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.is_active = true
    )
  );


