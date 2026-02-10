-- Add public access policy for user_links so requesters can view active links
-- This allows anyone to look up a link by link_id if it's active

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active links by link_id" ON public.user_links;

-- Create policy to allow public access to active links
CREATE POLICY "Public can view active links by link_id" ON public.user_links
  FOR SELECT USING (is_active = true);






