# Testing Deployment Guide

## Overview

To share your BMNL assessment with real human testers, you need to deploy to a public URL. `localhost:3000` only works on your computer. This guide shows you how to create a **preview/staging deployment** that testers can access.

## Option 1: Vercel Preview Deployment (Recommended)

Vercel automatically creates preview URLs for every branch/PR, perfect for testing.

### Step 1: Create a Testing Branch

```bash
# Create a new branch for testing
git checkout -b testing/bmnl-preview

# Add all your changes
git add .

# Commit your changes
git commit -m "BMNL features ready for testing"

# Push to GitHub
git push origin testing/bmnl-preview
```

### Step 2: Connect to Vercel (if not already connected)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your GitHub repository: `husasonja-gif/soulsort-ai`
4. Vercel will auto-detect Next.js settings
5. Click **Deploy**

### Step 3: Set Environment Variables in Vercel

**Important**: You need to add ALL environment variables to Vercel for the preview to work.

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add these variables (select **Preview** environment):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `OPENAI_API_KEY` = your OpenAI key
   - `NEXT_PUBLIC_APP_URL` = **This will be your preview URL** (see Step 4)
   - `ANSWER_ENCRYPTION_KEY` = your encryption key
   - `ADMIN_EMAILS` = your admin email(s)

### Step 4: Get Your Preview URL

After deploying, Vercel will give you a preview URL like:
- `https://soulsort-ai-git-testing-bmnl-preview-yourusername.vercel.app`

**Update `NEXT_PUBLIC_APP_URL`** in Vercel environment variables to this preview URL.

### Step 5: Add Preview URL to Supabase

**Critical**: Supabase needs to allow redirects to your preview URL.

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `https://your-preview-url.vercel.app/auth/callback`
   - `https://your-preview-url.vercel.app/auth/callback/bmnl`
   - `https://your-preview-url.vercel.app/*` (wildcard for all routes)

3. Add to **Site URL** (optional, for magic links):
   - `https://your-preview-url.vercel.app`

### Step 6: Redeploy

After updating environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **⋯** on the latest deployment
3. Select **Redeploy**

### Step 7: Share the Preview URL

Once deployed, share this URL with your testers:
```
https://your-preview-url.vercel.app/bmnl
```

## Option 2: Production Staging (Alternative)

If you want a permanent staging URL:

1. Create a separate Vercel project called `soulsort-ai-staging`
2. Connect it to the same GitHub repo
3. Deploy from a `staging` branch
4. Use a custom domain or Vercel's staging subdomain

## Testing Checklist

Before sharing with testers, verify:

- [ ] Preview URL loads correctly
- [ ] Magic link emails are sent
- [ ] Magic links redirect correctly to assessment
- [ ] Assessment questions load
- [ ] Answers are saved
- [ ] Dashboard shows results
- [ ] Encryption is working (check database)
- [ ] Gaming/phobic detection works
- [ ] Summary generation works

## Important Notes

1. **Preview URLs are temporary** - They update with each new commit to the branch
2. **Environment variables** - Must be set in Vercel for each environment (Preview, Production)
3. **Supabase redirects** - Must include preview URL in allowed redirects
4. **Magic links** - Will use the `NEXT_PUBLIC_APP_URL` you set in Vercel
5. **Data isolation** - Preview uses the same Supabase database (testers will create real participant records)

## After Testing

Once you've received feedback and made improvements:

1. Merge your testing branch to `main`
2. Deploy to production
3. Update Supabase redirect URLs to include production URL
4. Update `NEXT_PUBLIC_APP_URL` in Vercel production environment

## Troubleshooting

**Magic links not working:**
- Check Supabase redirect URLs include preview URL
- Verify `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
- Check Vercel deployment logs for errors

**Environment variables not working:**
- Make sure variables are set for **Preview** environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

**Preview URL not accessible:**
- Wait for deployment to complete (can take 2-5 minutes)
- Check Vercel deployment status
- Verify branch was pushed to GitHub


