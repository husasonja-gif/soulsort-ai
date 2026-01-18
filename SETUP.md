# SoulSort AI Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. An OpenAI API key

## Step-by-Step Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql` (required for main app)
   - `supabase/migrations/021_bmnl_schema.sql` (required for BMNL features)
3. **Optional**: Enable pgvector extension for vector embeddings:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   If you don't enable this, vector columns will be unused (analytics features will be limited).

4. Get your Supabase credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → anon/public key
   - Service Role Key: Settings → API → service_role key (required for BMNL, keep secret!)

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: `SUPABASE_SERVICE_ROLE_KEY` is required for BMNL (Burning Man Netherlands) features. Find it in Supabase Settings → API → service_role key.

### 4. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Features Overview

### User Flow
1. **Sign Up**: Magic link authentication via Supabase
2. **Onboarding**: Survey + LLM chat to create profile
3. **Dashboard**: View radar, manage consent, share link
4. **Requester Flow**: Share link → assessment → results

### BMNL (Burning Man Netherlands) Flow
1. **Landing Page** (`/bmnl`): Cultural onboarding introduction and consent
2. **Assessment** (`/bmnl/assessment`): 11-question cultural onboarding assessment
3. **Dashboard** (`/bmnl/dashboard`): View results, radar profile, and request data deletion

### Privacy Features
- No raw question responses stored
- GDPR-compliant consent ledger
- Vector-level analytics only (with consent)
- Data deletion support

### Versioning
All data includes version tracking:
- `schema_version`: Database schema version
- `model_version`: LLM model version
- `scoring_version`: Scoring algorithm version

## Troubleshooting

### Database Errors
- Ensure all migrations are applied (including `021_bmnl_schema.sql` for BMNL)
- Check Row Level Security policies are enabled
- Verify Supabase credentials are correct
- For BMNL errors: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### LLM Errors
- Verify OpenAI API key is valid
- Check API rate limits
- Ensure sufficient credits

### Vector Extension
If you see errors about vector types:
- Either enable pgvector extension in Supabase
- Or comment out vector-related columns in the schema

## Next Steps

1. Customize LLM prompts in `lib/llm.ts`
2. Implement analytics clustering in `app/api/analytics/archetype/route.ts`
3. Add payment integration for premium features
4. Implement data deletion endpoint
5. Add email service for waitlist






