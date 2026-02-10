# Production Deployment Checklist

## Production Domain
**Production URL**: `https://soulsortai.com`

## Step-by-Step Production Deployment

### Step 1: Commit and Push Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add BMNL features: authentication, assessment, dashboard, encryption"

# Push to main branch
git push origin main
```

### Step 2: Verify Vercel Production Environment Variables

1. Go to [vercel.com](https://vercel.com) → Your `soulsort-ai` project
2. **Settings** → **Environment Variables**
3. Verify these variables are set for **Production** environment:

   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `OPENAI_API_KEY`
   - ✅ `NEXT_PUBLIC_APP_URL` = `https://soulsortai.com`
   - ✅ `ANSWER_ENCRYPTION_KEY`
   - ✅ `ADMIN_EMAILS`

4. If any are missing, add them now (select **Production** environment)

### Step 3: Update Supabase Redirect URLs (CRITICAL)

**This is required for BMNL magic links to work in production.**

1. Go to Supabase Dashboard → Your project
2. **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://soulsortai.com/auth/callback
   https://soulsortai.com/auth/callback/bmnl
   https://soulsortai.com/bmnl/dashboard
   https://soulsortai.com/bmnl/assessment
   https://soulsortai.com/bmnl/start
   ```

   Or use wildcard pattern:
   ```
   https://soulsortai.com/*
   ```

4. **Site URL** should be: `https://soulsortai.com`

### Step 4: Wait for Vercel Deployment

After pushing to `main`:
1. Go to Vercel Dashboard → **Deployments**
2. Watch the deployment progress
3. Wait for deployment to complete (2-5 minutes)
4. Verify deployment status is "Ready" ✅

### Step 5: Verify Production Deployment

Test the following URLs in production:

1. **BMNL Landing**: `https://soulsortai.com/bmnl`
2. **BMNL Login**: `https://soulsortai.com/bmnl/login`
3. **Main App**: `https://soulsortai.com`
4. **Dashboard**: `https://soulsortai.com/dashboard` (after login)

### Step 6: Test Magic Link Flow

1. Go to `https://soulsortai.com/bmnl`
2. Check consent box
3. Click "Start Cultural Onboarding"
4. Enter email on login page
5. Click "Send magic link"
6. **Check email** for magic link
7. Click magic link - should redirect to assessment (not homepage)
8. Complete assessment - should show dashboard

### Step 7: Production Checklist

Before going live, verify:

- [ ] All environment variables set in Vercel Production
- [ ] Supabase redirect URLs include production domain
- [ ] `NEXT_PUBLIC_APP_URL` = `https://soulsortai.com` in Vercel
- [ ] Magic link redirects to `/auth/callback/bmnl` correctly
- [ ] Assessment loads and saves answers
- [ ] Dashboard shows results after completion
- [ ] Encryption is working (answers encrypted in database)
- [ ] Gaming/phobic detection works (try test answers)
- [ ] Summary generation works
- [ ] No console errors in production

### Step 8: Monitor After Deployment

- Check Vercel deployment logs for errors
- Monitor Supabase logs for authentication issues
- Test with multiple email addresses
- Verify data is being saved correctly

## Troubleshooting Production Issues

**Magic links not working:**
- ✅ Check Supabase redirect URLs include `https://soulsortai.com/auth/callback/bmnl`
- ✅ Verify `NEXT_PUBLIC_APP_URL` is set to `https://soulsortai.com` in Vercel
- ✅ Check Vercel deployment logs for errors

**Environment variables not working:**
- ✅ Make sure variables are set for **Production** environment (not just Preview)
- ✅ Redeploy after adding variables
- ✅ Variable names are case-sensitive

**Assessment not loading:**
- ✅ Check Supabase service role key is set in Vercel
- ✅ Verify database migrations are run (021_bmnl_schema.sql)
- ✅ Check Vercel function logs for API errors

## Post-Deployment

After successful deployment:
1. Monitor for any errors in Vercel logs
2. Test with real users
3. Check Supabase for data coming in correctly
4. Verify encryption is working (answers should be encrypted)


