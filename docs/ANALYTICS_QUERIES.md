# Analytics SQL Queries

This document contains example SQL queries for common analytics metrics in SoulSort AI.

## Funnel Conversion Rates

### Requester Funnel Completion Rate
```sql
-- Overall completion rate (started → completed)
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
  COUNT(*) as started,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE completed_at IS NOT NULL) / COUNT(*),
    2
  ) as completion_rate_pct
FROM requester_sessions
WHERE started_at >= NOW() - INTERVAL '30 days';
```

### Requester Funnel by Stage
```sql
-- Drop-off at each stage
SELECT 
  COUNT(*) as total_started,
  COUNT(*) FILTER (WHERE consent_granted_at IS NOT NULL) as consent_granted,
  COUNT(*) FILTER (WHERE questions_started_at IS NOT NULL) as questions_started,
  COUNT(*) FILTER (WHERE questions_completed_at IS NOT NULL) as questions_completed,
  COUNT(*) FILTER (WHERE assessment_generated_at IS NOT NULL) as assessment_generated,
  COUNT(*) FILTER (WHERE results_viewed_at IS NOT NULL) as results_viewed,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as fully_completed,
  
  -- Conversion rates
  ROUND(100.0 * COUNT(*) FILTER (WHERE consent_granted_at IS NOT NULL) / COUNT(*), 2) as consent_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE questions_started_at IS NOT NULL) / COUNT(*) FILTER (WHERE consent_granted_at IS NOT NULL), 2) as questions_start_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE completed_at IS NOT NULL) / COUNT(*), 2) as overall_completion_rate
FROM requester_sessions
WHERE started_at >= NOW() - INTERVAL '30 days';
```

### Drop-off Analysis
```sql
-- Where users are dropping off
SELECT 
  drop_off_stage,
  COUNT(*) as drop_off_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct_of_drop_offs
FROM requester_sessions
WHERE abandoned_at IS NOT NULL
  AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY drop_off_stage
ORDER BY drop_off_count DESC;
```

## Growth Loop Metrics

### Radars per Requester
```sql
-- Average number of radars completed per requester
SELECT 
  COUNT(DISTINCT requester_id) as unique_requesters,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_radars,
  ROUND(
    1.0 * COUNT(*) FILTER (WHERE completed_at IS NOT NULL) / NULLIF(COUNT(DISTINCT requester_id), 0),
    2
  ) as avg_radars_per_requester
FROM requester_sessions
WHERE started_at >= NOW() - INTERVAL '30 days'
  AND requester_id IS NOT NULL;
```

### Shares → New Requester Signups
```sql
-- Conversion from share to requester signup
SELECT 
  COUNT(DISTINCT sa.user_id) as users_who_shared,
  COUNT(DISTINCT rs.requester_id) as unique_requesters,
  COUNT(DISTINCT rs.converted_user_id) FILTER (WHERE rs.converted_to_user = TRUE) as converted_to_users,
  
  -- Conversion rate: shares → signups
  ROUND(
    100.0 * COUNT(DISTINCT rs.converted_user_id) FILTER (WHERE rs.converted_to_user = TRUE) / 
    NULLIF(COUNT(DISTINCT sa.user_id), 0),
    2
  ) as share_to_signup_rate_pct
FROM share_actions sa
LEFT JOIN requester_sessions rs ON sa.link_id = rs.link_id
WHERE sa.created_at >= NOW() - INTERVAL '30 days';
```

### Viral Coefficient (Shares per User)
```sql
-- How many shares per user (viral growth metric)
SELECT 
  COUNT(DISTINCT sa.user_id) as users_who_shared,
  COUNT(*) as total_shares,
  ROUND(
    1.0 * COUNT(*) / NULLIF(COUNT(DISTINCT sa.user_id), 0),
    2
  ) as avg_shares_per_user
FROM share_actions sa
WHERE sa.created_at >= NOW() - INTERVAL '30 days';
```

## Engagement & Stickiness

### Completion Times
```sql
-- Average completion time by stage
SELECT 
  AVG(EXTRACT(EPOCH FROM (consent_granted_at - started_at)) * 1000) as avg_consent_time_ms,
  AVG(EXTRACT(EPOCH FROM (questions_started_at - consent_granted_at)) * 1000) as avg_questions_start_time_ms,
  AVG(EXTRACT(EPOCH FROM (questions_completed_at - questions_started_at)) * 1000) as avg_questions_time_ms,
  AVG(EXTRACT(EPOCH FROM (assessment_generated_at - questions_completed_at)) * 1000) as avg_assessment_time_ms,
  AVG(completion_time_ms) as avg_total_completion_time_ms
FROM requester_sessions
WHERE completed_at IS NOT NULL
  AND started_at >= NOW() - INTERVAL '30 days';
```

### Return Visits to Dashboard
```sql
-- Dashboard stickiness (DAU/MAU ratio)
SELECT 
  COUNT(DISTINCT user_id) FILTER (WHERE visit_date = CURRENT_DATE) as daily_active_users,
  COUNT(DISTINCT user_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_active_users,
  ROUND(
    100.0 * COUNT(DISTINCT user_id) FILTER (WHERE visit_date = CURRENT_DATE) / 
    NULLIF(COUNT(DISTINCT user_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'), 0),
    2
  ) as stickiness_ratio_pct
FROM dashboard_visits;
```

### User Retention (Returning Users)
```sql
-- Users who visited dashboard multiple times
SELECT 
  user_id,
  COUNT(DISTINCT visit_date) as days_active,
  SUM(visit_count) as total_visits,
  MIN(visit_date) as first_visit,
  MAX(visit_date) as last_visit
FROM dashboard_visits
WHERE visit_date >= NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(DISTINCT visit_date) > 1
ORDER BY days_active DESC;
```

## Infrastructure & Cost Health

### OpenAI Cost per Completion
```sql
-- Average cost per completed requester assessment
SELECT 
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.completed_at IS NOT NULL) as completed_assessments,
  SUM(ou.cost_usd) FILTER (WHERE ou.endpoint = 'requester_assess') as total_cost,
  ROUND(
    SUM(ou.cost_usd) FILTER (WHERE ou.endpoint = 'requester_assess') / 
    NULLIF(COUNT(DISTINCT rs.id) FILTER (WHERE rs.completed_at IS NOT NULL), 0),
    4
  ) as avg_cost_per_completion
FROM requester_sessions rs
LEFT JOIN openai_usage ou ON rs.id = ou.requester_session_id
WHERE rs.started_at >= NOW() - INTERVAL '30 days';
```

### OpenAI Usage by Endpoint
```sql
-- Cost breakdown by API endpoint
SELECT 
  endpoint,
  COUNT(*) as api_calls,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_call,
  AVG(response_time_ms) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE success = FALSE) as error_count
FROM openai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY endpoint
ORDER BY total_cost_usd DESC;
```

### Error Rates
```sql
-- Error rate by endpoint
SELECT 
  endpoint,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = FALSE) as error_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE success = FALSE) / COUNT(*),
    2
  ) as error_rate_pct
FROM openai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY endpoint
ORDER BY error_rate_pct DESC;
```

### Daily Cost Trends
```sql
-- Daily OpenAI costs
SELECT 
  DATE(created_at) as date,
  COUNT(*) as api_calls,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as daily_cost_usd
FROM openai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Onboarding Funnel

### Onboarding Completion Rate
```sql
-- User onboarding funnel
SELECT 
  COUNT(*) FILTER (WHERE event_type = 'onboarding_started') as started,
  COUNT(*) FILTER (WHERE event_type = 'onboarding_completed') as completed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_type = 'onboarding_completed') / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'onboarding_started'), 0),
    2
  ) as completion_rate_pct
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND event_type IN ('onboarding_started', 'onboarding_completed');
```

## Vector Analytics (Consent-Only)

### Archetype Distribution
```sql
-- Average vector values for archetype analysis
SELECT 
  AVG(values_vector[1]) as avg_self_transcendence,
  AVG(values_vector[2]) as avg_self_enhancement,
  AVG(values_vector[3]) as avg_rooting,
  AVG(values_vector[4]) as avg_searching,
  AVG(relational_vector[1]) as avg_relational_1,
  AVG(erotic_vector[1]) as avg_erotic_1
FROM vector_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';
```

