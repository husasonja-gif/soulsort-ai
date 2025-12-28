# Database Migration Guide

## Issues and Fixes

### Issue 1: Table Not Found
The error `Could not find the table 'public.user_radar_profiles' in the schema cache` means the database tables haven't been created yet.

### Issue 2: RLS Policy Violation
The error `new row violates row-level security policy for table "user_radar_profiles"` means the INSERT policy is missing.

## Solution: Run the Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Tables Created**
   - Go to Table Editor in Supabase
   - You should see these tables:
     - `user_profiles`
     - `user_radar_profiles`
     - `consent_ledger`
     - `user_links`
     - `requester_assessments`
     - `archetype_fingerprints`

4. **Enable pgvector Extension (Optional)**
   - If you want to use vector embeddings, run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - Note: This requires the pgvector extension to be enabled in your Supabase project

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply all migrations in the `supabase/migrations/` directory.

## Fix RLS Policy Issue

If you're getting the error `new row violates row-level security policy for table "user_radar_profiles"`, you need to add the missing INSERT policy:

1. **Open Supabase Dashboard → SQL Editor**
2. **Run the fix migration:**
   - Copy the contents of `supabase/migrations/002_fix_rls_policies.sql`
   - Paste it into the SQL Editor
   - Click "Run"

Or run this SQL directly (idempotent - safe to run multiple times):

```sql
-- Add INSERT policy for users to create their own radar profile (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_radar_profiles' 
    AND policyname = 'Users can insert own radar'
  ) THEN
    CREATE POLICY "Users can insert own radar" ON public.user_radar_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
```

This will allow authenticated users to insert their own radar profiles. The migration is idempotent, so it's safe to run even if the policy already exists.



