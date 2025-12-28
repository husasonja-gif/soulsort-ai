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
2. Go to SQL Editor and run the migration file:
   - `supabase/migrations/001_initial_schema.sql`
3. **Optional**: Enable pgvector extension for vector embeddings:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   If you don't enable this, vector columns will be unused (analytics features will be limited).

4. Get your Supabase credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → anon/public key

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
- Ensure all migrations are applied
- Check Row Level Security policies are enabled
- Verify Supabase credentials are correct

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




