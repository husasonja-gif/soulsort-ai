# Open Graph Cache Fix Guide

## Problem
Social media platforms (WhatsApp, Twitter, Facebook, etc.) cache Open Graph metadata aggressively. Even after deploying new metadata, old previews can persist for hours or days.

## Solutions Implemented

### 1. Added `metadataBase`
- Ensures absolute URLs are used in OG tags
- Required for proper OG tag resolution

### 2. Dynamic Metadata Generation
- Added `generateMetadata` to `/r/[linkId]/page.tsx`
- Ensures each shared link has its own metadata context

### 3. Cache Control Headers
- Added explicit no-cache headers in metadata
- Helps prevent stale caching

### 4. OG Route Endpoint
- Created `/api/og` endpoint for manual cache refresh
- Can be used to force re-scraping

## How to Force Cache Refresh

### Method 1: Platform-Specific Tools

**Facebook/WhatsApp:**
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://soulsortai.com/r/YOUR_LINK_ID`
3. Click "Scrape Again" or "Debug"
4. This forces Facebook/WhatsApp to re-fetch the metadata

**Twitter:**
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Click "Preview card"
4. This forces Twitter to refresh

**LinkedIn:**
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Click "Inspect"

### Method 2: Add Query Parameter (Temporary)
Add `?v=2` or `?og=refresh` to your shared links temporarily to force cache bypass:
```
https://soulsortai.com/r/YOUR_LINK_ID?v=2
```

### Method 3: Wait for Natural Cache Expiry
- Facebook/WhatsApp: Usually 24-48 hours
- Twitter: Usually 7 days
- LinkedIn: Usually 7 days

## Verification

1. **Check HTML Source:**
   - Visit your URL in a browser
   - View page source (Ctrl+U)
   - Search for `og:title` and `og:description`
   - Verify they match the new text

2. **Use Vercel OG Inspector:**
   - Go to Vercel Dashboard → Your Deployment → Open Graph tab
   - This shows what Vercel sees (may differ from social platforms)

3. **Test with curl:**
   ```bash
   curl -I https://soulsortai.com/r/YOUR_LINK_ID
   ```
   Check for cache-control headers

## Current Metadata

- **Title:** "SoulSort AI - A Vibe-Check Engine"
- **Description:** "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy."

## Notes

- The metadata is correctly set in the code
- Social platforms cache aggressively for performance
- Use platform debuggers to force refresh when needed
- The `/api/og` endpoint can be used as a fallback for manual scraping





