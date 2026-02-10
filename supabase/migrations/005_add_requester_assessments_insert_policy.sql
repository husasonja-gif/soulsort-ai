-- Add INSERT policy for requester_assessments
-- Allows anyone to insert assessments for active links (requesters are anonymous)

DROP POLICY IF EXISTS "Anyone can insert assessments for active links" ON public.requester_assessments;

CREATE POLICY "Anyone can insert assessments for active links" ON public.requester_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_links ul
      WHERE ul.link_id = requester_assessments.link_id
        AND ul.is_active = true
    )
  );






