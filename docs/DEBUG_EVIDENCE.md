# Debug Evidence Logging

## Overview

To view evidence strings and raw OpenAI prompts/responses during onboarding, you need to enable debug logging.

## Setup

### Local Development

1. Create or update `.env.local`:
   ```
   DEBUG_EVIDENCE=true
   NODE_ENV=development
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. View logs in your terminal where the dev server is running.

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add:
   - **Name**: `DEBUG_EVIDENCE`
   - **Value**: `true`
   - **Environment**: Production (or Preview/Development as needed)

3. Redeploy your application

4. View logs in Vercel Dashboard → Your Project → Logs

## What Gets Logged

When `DEBUG_EVIDENCE=true` and `NODE_ENV !== 'production'`, you'll see:

- **Extracted onboarding answers** (raw text)
- **Full prompts sent to OpenAI** (with raw answers included)
- **Evidence triggers** (Q1, Q2, Q3, Q4 triggers from LLM response)
- **Deltas and flags** from LLM

## Privacy Note

⚠️ **Important**: Evidence logging is **disabled by default** in production for privacy. Only enable `DEBUG_EVIDENCE=true` when actively debugging, and never commit it to your repository.

## Alternative: LOG_RAW

For requester assessments, use:
```
LOG_RAW=true
```

This logs raw requester responses (dev only).




