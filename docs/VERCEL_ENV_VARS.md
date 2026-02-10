# Vercel Environment Variables - What's Actually Needed

## Current Status

Based on your Vercel setup, you already have:
- ✅ `ANSWER_ENCRYPTION_KEY` (required for BMNL)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (required for BMNL)
- ✅ `ADMIN_EMAILS` (for analytics)
- ✅ `DEBUG_EVIDENCE` (optional)

## Variables You DON'T Need to Add

If your main SoulSort app works without these, **you don't need to add them**:

- ❌ `NEXT_PUBLIC_SUPABASE_URL` - Likely set via Vercel's Supabase integration
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Likely set via Vercel's Supabase integration  
- ❌ `NEXT_PUBLIC_APP_URL` - May have a default or be set elsewhere

**Why the security warning?** Vercel shows warnings for `NEXT_PUBLIC_*` variables because they're exposed to the browser. However, if Vercel has a Supabase integration configured, these are automatically injected and you don't need to set them manually.

## Required Variables for BMNL

**Minimum required for BMNL to work:**

1. ✅ `ANSWER_ENCRYPTION_KEY` - **You have this**
2. ✅ `SUPABASE_SERVICE_ROLE_KEY` - **You have this**

**Optional but recommended:**

3. `OPENAI_API_KEY` - Required for summary generation (if not already set)
4. `ADMIN_EMAILS` - **You have this**

## How to Check if Supabase Variables Are Set

1. Go to Vercel Dashboard → Your Project → **Settings** → **Integrations**
2. Check if **Supabase** integration is connected
3. If connected, Supabase URL and Anon Key are automatically available

Alternatively, check your Vercel project's **Environment Variables** and look for variables that might be prefixed differently or set at the project level.

## What to Do

1. **Don't add** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `NEXT_PUBLIC_APP_URL` if your app already works
2. **Verify** `OPENAI_API_KEY` is set (for summary generation)
3. **Fix the TypeScript error** (already done)
4. **Redeploy** after the fix

## Testing After Fix

After the TypeScript fix is deployed:
1. Test BMNL landing page: `https://soulsortai.com/bmnl`
2. Test magic link flow
3. Test assessment completion
4. Check that summaries are generated (requires `OPENAI_API_KEY`)


