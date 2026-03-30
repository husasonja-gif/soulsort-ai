import { getUserLinkByLinkId } from '@/lib/db'
import RequesterClient from './RequesterClient'
import type { Metadata } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soulsortai.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ linkId: string }>
}): Promise<Metadata> {
  const { linkId } = await params
  const url = `${appUrl}/r/${linkId}`
  
  return {
    title: "SoulSort AI - A Vibe-Check Engine",
    description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
    openGraph: {
      title: "SoulSort AI - A Vibe-Check Engine",
      description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
      type: "website",
      url: url,
      siteName: "SoulSort AI",
    },
    twitter: {
      card: "summary",
      title: "SoulSort AI - A Vibe-Check Engine",
      description: "Map how you connect & spark better conversations. Share your radar. Compare alignment before you invest energy.",
    },
  }
}

export default async function RequesterPage({
  params,
}: {
  params: Promise<{ linkId: string }>
}) {
  const { linkId } = await params
  const link = await getUserLinkByLinkId(linkId)

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900">
        <div className="max-w-md rounded-2xl border border-purple-300/20 bg-white/10 p-8 text-center shadow-lg backdrop-blur-xl">
          <h1 className="mb-4 text-2xl font-bold text-white">Link Not Found</h1>
          <p className="text-purple-100/80">
            This compatibility link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  return <RequesterClient linkId={linkId} userId={link.user_id} />
}
