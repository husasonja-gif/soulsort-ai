# SoulSort v2: Burning Man Netherlands Implementation

## Status: In Progress

This document tracks the implementation of SoulSort v2 for Burning Man Netherlands cultural onboarding.

## Completed Components

### 1. Database Schema ✅
- **File**: `supabase/migrations/021_bmnl_schema.sql`
- **Tables Created**:
  - `bmnl_participants` - Participant profiles with GDPR compliance
  - `bmnl_answers` - Raw answers (stored for 6 months)
  - `bmnl_radar_profiles` - Non-numeric radar (low/medium/high)
  - `bmnl_signals` - LLM signal extraction per question
  - `bmnl_flags` - Flags for organizer review
  - `bmnl_consent_log` - GDPR consent tracking
  - `bmnl_organizers` - Organizer access control
- **Features**:
  - Automatic deletion on 30 July 2026
  - RLS policies for participant/organizer separation
  - Service role access for API operations

### 2. Landing Page ✅
- **File**: `app/bmnl/page.tsx`
- **Features**:
  - BM NL branding (orange/yellow/red theme)
  - Clear explanation of what this is/isn't
  - Explicit consent checkbox
  - Email collection
  - GDPR transparency

### 3. Start API ✅
- **File**: `app/api/bmnl/start/route.ts`
- **Features**:
  - Participant creation
  - Magic link generation
  - Consent logging
  - Token-based auth fallback

### 4. Signal Extraction Library ✅
- **File**: `lib/bmnl-llm.ts`
- **Features**:
  - Per-question signal extraction (low/medium/high)
  - Flag detection (garbage, gaming, phobic, defensive)
  - Code-level aggregation to radar (no LLM scoring)
  - Question-to-axis mapping

### 5. Assessment Chat UI ✅
- **File**: `app/bmnl/assessment/page.tsx`
- **Features**:
  - 11-question flow
  - Garbage response handling
  - Phobic language detection
  - Progress tracking

## Remaining Components

### 1. Assessment API Routes ⏳
- `app/api/bmnl/assessment/start/route.ts` - Start assessment
- `app/api/bmnl/assessment/answer/route.ts` - Process answer, extract signal
- `app/api/bmnl/assessment/complete/route.ts` - Aggregate signals, create radar

### 2. Participant Dashboard ⏳
- `app/bmnl/dashboard/page.tsx` - Show radar (low/medium/high), answers, status
- Radar visualization component (6 axes)
- Answer viewing (read-only, timestamped)
- GDPR access compliance

### 3. Organizer Dashboard ⏳
- `app/bmnl/organizer/page.tsx` - Overview, flagged participants
- Participant table with filters
- Flag review interface
- Human decision tracking

### 4. GDPR Features ⏳
- `app/api/bmnl/delete/route.ts` - Manual deletion request
- `app/api/bmnl/export/route.ts` - Data export (GDPR access)
- Automatic deletion cron job
- Encryption for sensitive fields

### 5. Additional Components ⏳
- Radar visualization component (non-numeric)
- Flag review UI
- Email notifications (magic links)
- Admin/organizer authentication

## Next Steps

1. Complete assessment API routes
2. Build participant dashboard
3. Build organizer dashboard
4. Implement GDPR features
5. Add radar visualization
6. Test end-to-end flow
7. Deploy and test with BM NL organizers

## Design Principles

- **Privacy-first**: Raw answers stored, 6-month retention, encryption
- **Human-in-the-loop**: AI flags, humans decide
- **Transparency**: Clear explanations, no hidden scoring
- **Non-judgmental**: Learning-focused, not ranking
- **BM NL Branding**: Orange/yellow/red, grounded, playful





