# Analytics Dashboard Setup

## Quick Start

The analytics dashboard is now fully implemented and ready to use!

## Access the Dashboard

1. Navigate to `/analytics` in your browser
2. Or click the "Analytics" button in your user dashboard

## Admin Access Configuration

The dashboard requires admin access. To set up admin access:

### Option 1: Environment Variable (Recommended)

Add your admin email(s) to `.env.local`:

```env
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

### Option 2: Modify the Admin Check

Edit `app/api/analytics/metrics/route.ts` and modify the `isAdmin` function:

```typescript
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  // Add your admin email here
  const adminEmails = ['your-email@example.com', 'another-admin@example.com']
  return adminEmails.includes(email.toLowerCase())
}
```

## What's Included

### Dashboard Page
- **Location**: `app/analytics/page.tsx`
- **Features**:
  - Date range selector (7d, 30d, 90d)
  - Key metrics cards
  - Interactive charts
  - Dark mode support

### Components
- `MetricCard` - Display key metrics
- `FunnelChart` - Requester funnel visualization
- `CostChart` - OpenAI cost trends
- `EngagementChart` - User engagement metrics
- `GrowthLoopChart` - Growth loop metrics

### API Route
- **Location**: `app/api/analytics/metrics/route.ts`
- **Endpoint**: `/api/analytics/metrics?range=30d`
- **Features**:
  - Admin access check
  - Fetches all metrics in parallel
  - Returns formatted data for dashboard

## Metrics Tracked

1. **Funnel Metrics**
   - Total requesters started
   - Consent granted
   - Questions started
   - Completed assessments

2. **Growth Loop Metrics**
   - Total shares
   - Signups from shares
   - Share → signup conversion rate
   - Average radars per requester

3. **Engagement Metrics**
   - Daily Active Users (DAU)
   - Monthly Active Users (MAU)
   - Stickiness (DAU/MAU ratio)
   - Average completion time

4. **Cost Metrics**
   - Daily OpenAI costs
   - Average cost per completion
   - API call counts

## Testing

1. **Set Admin Email**: Add your email to `ADMIN_EMAILS` in `.env.local`
2. **Restart Dev Server**: Restart your Next.js dev server
3. **Navigate**: Go to `http://localhost:3000/analytics`
4. **Verify**: You should see the dashboard with metrics (may be empty if no data yet)

## Troubleshooting

### "Access denied" Error
- Check that your email is in `ADMIN_EMAILS` environment variable
- Make sure you're logged in with the correct account
- Restart your dev server after changing `.env.local`

### No Data Showing
- This is normal if you haven't generated any analytics data yet
- Complete a requester flow to generate test data
- Check that analytics tracking is working (see `ANALYTICS_TRACKING_STATUS.md`)

### Charts Not Rendering
- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for errors
- Verify data format matches component expectations

## Next Steps

1. ✅ Set up admin email access
2. ✅ Test the dashboard
3. ⏳ Generate some test data by using the app
4. ⏳ Customize metrics as needed
5. ⏳ Add more charts or metrics

