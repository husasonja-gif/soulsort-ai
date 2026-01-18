-- Add missing INSERT policy for user_profiles table
-- This allows users to create their own profile if the trigger didn't fire

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create INSERT policy
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);





