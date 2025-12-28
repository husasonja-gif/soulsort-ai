# Production Deployment Checklist

## Domain Configuration

### Environment Variables
Update `.env.local` (or your production environment variables):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=https://soulsortai.com
```

**Important**: Set `NEXT_PUBLIC_APP_URL=https://soulsortai.com` for production.

### Supabase Configuration
1. **Auth Redirect URLs**: In Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: Set to `https://soulsortai.com` (default redirect URL)
   - **Redirect URLs**: Add `https://soulsortai.com/auth/callback` (where users are redirected after magic link login)
   
   ✅ **You've already configured this correctly!**

2. **CORS Settings** (No action needed):
   - **REST API**: Supabase's REST API accepts requests from any origin by default when using the `anon` key. CORS is handled automatically - no configuration needed in the dashboard.
   - **Security**: Your API security is provided by Row Level Security (RLS) policies, not CORS restrictions.
   - **Storage**: If you use Supabase Storage in the future, CORS settings can be configured per bucket under Storage → [Bucket Name] → Settings → CORS, but this is not needed for your current setup.

## Security Checklist

### ✅ Environment Variables
- [ ] All sensitive keys are in environment variables (not hardcoded)
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Production environment variables are set in your hosting platform

### ✅ API Keys
- [ ] OpenAI API key is secure and has rate limits configured
- [ ] Supabase keys are production keys (not test keys)
- [ ] Consider using Supabase service role key for server-side operations (if needed)

### ✅ Data Privacy
- [ ] GDPR compliance verified (consent ledger, data deletion working)
- [ ] No raw user responses stored (already implemented)
- [ ] Row Level Security (RLS) policies are active in Supabase
- [ ] Test data deletion endpoint works correctly

## Performance Optimization

### ✅ Build Optimization
- [ ] Run `npm run build` successfully
- [ ] Check for build warnings/errors
- [ ] Verify bundle size is reasonable
- [ ] Enable production optimizations in Next.js config if needed

### ✅ Image/Asset Optimization
- [ ] Verify all images are optimized
- [ ] Check font loading (currently using Google Fonts - consider self-hosting for better performance)

## Testing Checklist

### ✅ Core Functionality
- [ ] User sign-up/login flow works
- [ ] Onboarding survey and chat complete successfully
- [ ] Dashboard loads with radar chart
- [ ] Share link generation works
- [ ] Requester flow completes assessment
- [ ] Results page displays correctly
- [ ] QR code generation works
- [ ] PNG export works

### ✅ Responsive Design
- [ ] Test on mobile (320px+)
- [ ] Test on tablet (768px+)
- [ ] Test on laptop/desktop (1024px+)
- [ ] All forms are usable on mobile
- [ ] Charts are readable on all screen sizes
- [ ] Navigation works on mobile

### ✅ Dark Mode
- [ ] Dark mode toggle works on all pages
- [ ] Theme persists across page refreshes
- [ ] All text is readable in dark mode
- [ ] Charts are visible in dark mode
- [ ] Forms are usable in dark mode

### ✅ Browser Compatibility
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if targeting Mac users)
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)

## Hosting Configuration

### Recommended: Vercel
1. **Connect Repository**: Link your GitHub/GitLab repo to Vercel
2. **Environment Variables**: Add all environment variables in Vercel dashboard
3. **Domain**: Add `soulsortai.com` as custom domain
4. **Build Settings**: 
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### Alternative: Other Platforms
- Ensure Node.js 18+ is available
- Set build command: `npm run build`
- Set start command: `npm start`
- Configure custom domain DNS settings

## Database Migrations

### ✅ Migration Status
- [ ] All migrations in `supabase/migrations/` have been run
- [ ] Verify `001_initial_schema.sql` is applied
- [ ] Verify `009_add_dealbreaker_hits.sql` is applied (if using dealbreaker engine)
- [ ] Test database connections from production environment

### ✅ Database Backups
- [ ] Set up automatic backups in Supabase
- [ ] Test restore procedure (optional but recommended)

## Monitoring & Analytics

### ✅ Error Tracking
- [ ] Consider adding error tracking (Sentry, LogRocket, etc.)
- [ ] Set up logging for production errors
- [ ] Monitor API errors (OpenAI, Supabase)

### ✅ Analytics (Optional)
- [ ] If using analytics, ensure GDPR compliance
- [ ] Test analytics opt-in/opt-out flow
- [ ] Verify analytics only track consented users

## SEO & Metadata

### ✅ Meta Tags
- [ ] Update metadata in `app/layout.tsx` if needed
- [ ] Add Open Graph tags for social sharing (optional)
- [ ] Add favicon (already present at `app/favicon.ico`)

## API Rate Limits

### ✅ OpenAI
- [ ] Monitor OpenAI API usage
- [ ] Set up billing alerts
- [ ] Consider implementing rate limiting for users if needed

### ✅ Supabase
- [ ] Monitor Supabase usage (database, auth, storage)
- [ ] Set up usage alerts
- [ ] Verify project limits are sufficient

## Final Pre-Launch Checks

- [ ] All environment variables are set correctly
- [ ] Domain is configured and SSL certificate is active
- [ ] Test full user flow end-to-end in production
- [ ] Test requester flow end-to-end
- [ ] Verify share links work with production domain
- [ ] Check that email magic links work with production domain
- [ ] Test dark mode on all pages
- [ ] Test responsive design on real devices
- [ ] Verify data deletion works
- [ ] Check that error messages are user-friendly
- [ ] Remove any console.log statements with sensitive data (already gated behind LOG_RAW env var)

## Post-Launch Monitoring

- [ ] Monitor error rates
- [ ] Monitor API costs
- [ ] Monitor user sign-ups and onboarding completion rates
- [ ] Collect user feedback
- [ ] Monitor server response times
- [ ] Check database query performance

## Recommended Improvements (Post-Launch)

1. **Error Tracking**: Add Sentry or similar for production error monitoring
2. **Analytics**: Implement privacy-first analytics (only with consent)
3. **Caching**: Consider adding Redis for session caching
4. **CDN**: Use Vercel's built-in CDN or configure CloudFront
5. **Email Templates**: Customize Supabase email templates for magic links
6. **Rate Limiting**: Add rate limiting to prevent abuse
7. **Monitoring Dashboard**: Set up uptime monitoring (UptimeRobot, Pingdom, etc.)

