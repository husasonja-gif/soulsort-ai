# SoulSort AI

A vibe-check engine designed for women and queers to prevent dating fatigue by pre-filtering connections using an LLM wrapper.

## Architecture

### 1. User Onboarding
- Supabase Auth with magic link (identity layer)
- Survey with toggles
- LLM chat to define SoulSort profile
- Dashboard with:
  - SoulSort Radar (spiderweb chart) with dimensional explanations
  - List of dealbreakers
  - Consent flags (public radar & analytics opt-in)
  - Data deletion action

### 2. Requester Flow
- Personalized user link to access survey
- LLM chat that evaluates profile based on predefined vectors
- Models healthy behaviors with interleaved commentary
- Results show:
  - Compatibility score
  - Summary
  - Radar overlay (requester vs user)

### 3. Landing Page
- Optimized for viral traffic
- Heavy on trust mechanisms
- CTA for becoming a User and joining waitlist

### 4. Analytics Layer
- Vector data storage (for consented users)
- Archetype radar fingerprints
- Used to improve AI prompts, chat flow, penalty structure, and abuse detection

### 5. Privacy-First Consent Ledger
- GDPR compliant
- Consent as basis for data collection
- No raw questions stored
- Analytics at vector level only

### 6. Result Versioning
- `schema_version`: Database schema version
- `model_version`: LLM model version used
- `scoring_version`: Scoring algorithm version

### 7. Paid Feature Gate
- Free tier: Limited assessments
- Premium tier: Unlimited assessments, advanced analytics, custom dealbreakers

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Auth (Magic Link)
- **LLM**: OpenAI GPT-4o-mini
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run Supabase migrations:
   - Apply `supabase/migrations/001_initial_schema.sql` to your Supabase project
   - Enable the `vector` extension if using pgvector for embeddings

4. Run the development server:
```bash
npm run dev
```

## Database Schema

- `user_profiles`: User account information
- `user_radar_profiles`: Radar dimensions and dealbreakers (vector data)
- `consent_ledger`: GDPR-compliant consent tracking
- `user_links`: Personalized shareable links
- `requester_assessments`: Compatibility assessments (no raw data)
- `archetype_fingerprints`: Aggregated, anonymized archetype data

## Privacy & GDPR

- No raw question responses are stored
- Only vector embeddings and computed dimensions
- Consent ledger tracks all consent changes with timestamps
- Users can revoke consent at any time
- Data deletion endpoint (stubbed, ready for implementation)

## Versioning

All assessments and profiles include:
- `schema_version`: Tracks database schema changes
- `model_version`: Tracks LLM model updates
- `scoring_version`: Tracks scoring algorithm changes

This enables future-proofing and allows for re-scoring with updated models.

## License

Private - All rights reserved
