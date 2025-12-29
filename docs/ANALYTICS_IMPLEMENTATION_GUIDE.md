# Analytics Implementation Guide

## Overview

This guide outlines the complete analytics system for SoulSort AI, designed to track funnel completion, growth loops, engagement, and infrastructure health while maintaining privacy-first principles.

## Key Principles

- ✅ **No raw text storage** - Only metadata and vectors (with consent)
- ✅ **Privacy-first defaults** - Opt-in analytics only
- ✅ **Investor-readable metrics** - Clear, actionable KPIs
- ✅ **Simple, not over-engineered** - Focus on essential metrics

## Implementation Steps

### 1. Database Schema Setup

Run the migration to create analytics tables:

```bash
# Apply the migration in Supabase SQL Editor
supabase/migrations/013_analytics_schema.sql
```

This creates:
- `analytics_events` - General event tracking
- `requester_sessions` - Requester funnel tracking
- `share_actions` - Growth loop tracking
- `openai_usage` - Cost and infrastructure health
- `vector_analytics` - Consent-only vector storage
- `dashboard_visits` - Engagement tracking

### 2. Instrument Your Code

#### Track Requester Sessions

In `app/r/[linkId]/RequesterClient.tsx`:

```typescript
// When requester starts
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    event_type: 'requester_started',
    link_id: linkId,
    session_token: generateSessionToken(),
  }),
})

// When consent granted
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    event_type: 'requester_consent_granted',
    session_token: sessionToken,
  }),
})

// When completed
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    event_type: 'requester_completed',
    session_token: sessionToken,
    completion_time_ms: Date.now() - startTime,
  }),
})
```

#### Track OpenAI Usage

In your API routes (e.g., `app/api/requester/assess/route.ts`):

```typescript
const startTime = Date.now()
const response = await openai.chat.completions.create({...})
const responseTime = Date.now() - startTime

// Track usage
await supabase.from('openai_usage').insert({
  requester_session_id: sessionId,
  endpoint: 'requester_assess',
  model: 'gpt-4o-mini',
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  total_tokens: response.usage.total_tokens,
  cost_usd: calculateCost(response.usage),
  response_time_ms: responseTime,
  success: true,
})
```

#### Track Share Actions

In `app/dashboard/DashboardClient.tsx`:

```typescript
const handleShare = async (method: string) => {
  await fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'share_clicked',
      share_method: method, // 'copy_link', 'qr_code', 'png_download'
    }),
  })
}
```

#### Track Dashboard Visits

In `app/dashboard/page.tsx`:

```typescript
// Server component - track visit
const supabase = await createSupabaseServerClient()
await supabase.rpc('track_dashboard_visit', {
  user_id: user.id,
})
```

### 3. Create Analytics API Routes

Create `app/api/analytics/track/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    
    // Insert analytics event
    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_type: body.event_type,
      event_data: body.event_data || {},
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
```

### 4. Build Analytics Dashboard

Follow the structure in `docs/ANALYTICS_DASHBOARD.md` to create:
- Main dashboard page
- Metric components
- Chart visualizations
- API routes for metrics

### 5. Set Up Cron Jobs (Optional)

For performance, set up daily aggregation:

1. Create Vercel Cron Job or use Supabase Edge Functions
2. Run daily at midnight to pre-compute metrics
3. Store in `daily_metrics` table for fast dashboard loading

## Metrics to Track

### Funnel Metrics
- Requester start → completion rate
- Drop-off at each stage
- Average completion time

### Growth Loop Metrics
- Radars per requester
- Shares → new signups conversion
- Viral coefficient (shares per user)

### Engagement Metrics
- Daily/Monthly Active Users
- Return visit rate
- Dashboard stickiness

### Infrastructure Metrics
- OpenAI cost per completion
- Error rates by endpoint
- API response times

## Privacy Considerations

1. **Vector Analytics**: Only stored if user consents (`analytics` consent type)
2. **Anonymous Tracking**: Use session tokens for anonymous requesters
3. **Data Retention**: Consider implementing data retention policies
4. **User Deletion**: Ensure analytics data is deleted when user deletes account

## Next Steps

1. ✅ Run database migration
2. ✅ Instrument code with tracking calls
3. ✅ Create analytics API routes
4. ✅ Build dashboard UI
5. ⏳ Set up cron jobs for aggregation
6. ⏳ Add alerts for key metrics
7. ⏳ Implement admin access control

## Resources

- **Schema**: `supabase/migrations/013_analytics_schema.sql`
- **Queries**: `docs/ANALYTICS_QUERIES.md`
- **Dashboard**: `docs/ANALYTICS_DASHBOARD.md`

