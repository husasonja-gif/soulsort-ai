# Analytics Tracking Implementation Status

## ✅ Completed

### 1. Database Schema
- ✅ All analytics tables created (`013_analytics_schema.sql`)
- ✅ Row Level Security policies configured
- ✅ Helper functions created

### 2. Requester Session Tracking
- ✅ Track when requester starts (`requester_started`)
- ✅ Track when consent is granted (`requester_consent_granted`)
- ✅ Track when assessment is completed (`requester_completed`)
- ✅ Session tokens generated for anonymous tracking
- ✅ Completion time tracking
- ✅ Requester sessions table integration

**Location**: `app/r/[linkId]/RequesterClient.tsx`

### 3. Share Actions Tracking
- ✅ Copy link tracking (`copy_link`)
- ✅ PNG download tracking (`png_download`)
- ✅ Share actions table integration

**Locations**:
- `app/dashboard/DashboardClient.tsx` (copy link)
- `components/ShareCard.tsx` (PNG download)

### 4. Dashboard Visits Tracking
- ✅ Automatic tracking on dashboard page load
- ✅ Uses `track_dashboard_visit` RPC function
- ✅ Tracks daily visits and visit counts

**Location**: `app/dashboard/page.tsx`

### 5. OpenAI Usage Tracking
- ✅ Cost calculation helper (`lib/openaiCost.ts`)
- ✅ Usage tracking helper (`lib/trackOpenAIUsage.ts`)
- ✅ Onboarding chat tracking (`onboarding_chat` endpoint)

**Location**: `app/api/onboarding/chat/route.ts`

### 6. Analytics API Route
- ✅ `/api/analytics/track` route created
- ✅ Event validation
- ✅ Requester session creation/updates
- ✅ Share action tracking integration

**Location**: `app/api/analytics/track/route.ts`

## ⚠️ Pending (Requires LLM Function Modifications)

### OpenAI Usage Tracking in LLM Functions

The following endpoints need OpenAI usage tracking added to their LLM function calls:

1. **`app/api/onboarding/complete/route.ts`**
   - Calls `generateUserRadarProfile()` from `lib/llm.ts`
   - Needs tracking for the OpenAI call inside this function
   - **Action**: Modify `generateUserRadarProfile()` to track usage

2. **`app/api/requester/assess/route.ts`**
   - Calls `assessRequester()` from `lib/llm.ts`
   - Needs tracking for the OpenAI call inside this function
   - **Action**: Modify `assessRequester()` to track usage

3. **`app/api/requester/commentary/route.ts`** (if exists)
   - May call OpenAI for commentary generation
   - **Action**: Add usage tracking if OpenAI is called

### How to Add Tracking to LLM Functions

In `lib/llm.ts`, modify the OpenAI calls to track usage:

```typescript
import { trackOpenAIUsage } from './trackOpenAIUsage'

// Inside generateUserRadarProfile or assessRequester:
const startTime = Date.now()
const response = await openai.chat.completions.create({...})
const responseTime = Date.now() - startTime

// Track usage
if (response.usage) {
  await trackOpenAIUsage({
    userId: userId, // Pass userId as parameter
    linkId: linkId, // If available
    endpoint: 'generate_profile', // or 'requester_assess', etc.
    model: 'gpt-4o-mini',
    usage: response.usage,
    responseTimeMs: responseTime,
    success: true,
  })
}
```

**Note**: You'll need to:
1. Add `userId` and optionally `linkId` as parameters to the LLM functions
2. Import `trackOpenAIUsage` in `lib/llm.ts`
3. Add tracking after each `openai.chat.completions.create()` call
4. Handle errors gracefully (don't let tracking break the main flow)

## 📋 Additional Tracking Opportunities

### QR Code Share Tracking
- **Status**: Not yet implemented
- **Location**: `components/ShareCard.tsx`
- **Action**: Add tracking when QR code is displayed/clicked

### Onboarding Funnel Tracking
- **Status**: Partially implemented
- **Needs**: Track `onboarding_started` and `onboarding_abandoned` events
- **Locations**: 
  - `app/onboarding/OnboardingClient.tsx` (add start tracking)
  - Add abandonment tracking (when user leaves page)

### Radar View Tracking
- **Status**: Not yet implemented
- **Action**: Track when users view their radar chart
- **Location**: `app/dashboard/DashboardClient.tsx`

## Testing Checklist

- [ ] Test requester session creation
- [ ] Test requester completion tracking
- [ ] Test share action tracking (copy link, PNG download)
- [ ] Test dashboard visit tracking
- [ ] Test OpenAI usage tracking in onboarding chat
- [ ] Verify analytics events appear in `analytics_events` table
- [ ] Verify requester sessions appear in `requester_sessions` table
- [ ] Verify share actions appear in `share_actions` table
- [ ] Verify dashboard visits appear in `dashboard_visits` table
- [ ] Verify OpenAI usage appears in `openai_usage` table

## Next Steps

1. **Complete OpenAI Usage Tracking**: Modify LLM functions to track usage
2. **Add QR Code Tracking**: Track when QR codes are generated/viewed
3. **Add Onboarding Tracking**: Track onboarding start and abandonment
4. **Add Radar View Tracking**: Track when users view their radar
5. **Build Analytics Dashboard**: Create the dashboard UI (Step 4 in guide)





