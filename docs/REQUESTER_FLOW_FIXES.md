# Requester Flow Error Fixes

## Issues Fixed

### 1. Better Error Logging
- Added detailed error logging in `assessRequester` call to see actual failure point
- Error messages now include stack traces for debugging

### 2. Graceful Table Handling
- Made event/trace storage resilient to missing tables (migrations not run yet)
- Analytics metrics fallback to `requester_sessions` if new tables don't exist
- No failures if `requester_assessment_events` or `requester_assessment_traces` tables are missing

### 3. Analytics Tracking
- Events are stored in both `requester_sessions` (existing) and `requester_assessment_events` (new, if exists)
- Analytics dashboard will show data from `requester_sessions` even if new tables don't exist yet

## Required Actions

### 1. Run Migrations
The new tables need to be created in Supabase:

```sql
-- Run these migrations in Supabase SQL Editor:
-- 1. supabase/migrations/016_boundaries_scale_v2.sql
-- 2. supabase/migrations/017_requester_analytics.sql
```

### 2. Check Server Logs
If you're still seeing "Failed to assess requester" errors, check:
- Vercel logs (or local server console)
- Look for the detailed error messages we added
- The error will show the actual failure point (OpenAI API, parsing, etc.)

### 3. Verify Analytics
- Analytics dashboard will work with existing `requester_sessions` table
- Once migrations are run, it will use the new `requester_assessment_events` table for better tracking
- Both will work, but new table provides better analytics

## Debugging Steps

1. **Check if error is in assessRequester:**
   - Look for "Error in assessRequester:" in logs
   - Check the error message and stack trace

2. **Check if tables exist:**
   - In Supabase, check if `requester_assessment_events` exists
   - If not, run migration 017

3. **Check OpenAI API:**
   - Verify `OPENAI_API_KEY` is set in Vercel
   - Check if API calls are succeeding

4. **Check requester_sessions:**
   - Verify that `requester_sessions` table has data
   - Analytics will use this as fallback

## Current Behavior

- **If new tables exist:** Uses `requester_assessment_events` for analytics
- **If new tables don't exist:** Falls back to `requester_sessions` (existing table)
- **Error handling:** Detailed logging, graceful degradation
- **No breaking changes:** Everything works with or without new tables





