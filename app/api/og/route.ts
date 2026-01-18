import { NextResponse } from 'next/server'

// This route helps force cache refresh by providing a dynamic endpoint
// Social platforms can scrape this to get fresh metadata
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('linkId')
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soulsortai.com'
  const url = linkId ? `${appUrl}/r/${linkId}` : appUrl
  
  // Return HTML with OG tags for scraping
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="SoulSort AI - A Vibe-Check Engine" />
  <meta property="og:description" content="Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="SoulSort AI" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="SoulSort AI - A Vibe-Check Engine" />
  <meta name="twitter:description" content="Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy." />
  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${url}</a></p>
</body>
</html>`
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}




