import { getUserLinkByLinkId } from '@/lib/db'
import RequesterClient from './RequesterClient'

export default async function RequesterPage({
  params,
}: {
  params: Promise<{ linkId: string }>
}) {
  const { linkId } = await params
  const link = await getUserLinkByLinkId(linkId)

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="text-center p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 dark:text-gray-100">Link Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">
            This compatibility link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  return <RequesterClient linkId={linkId} userId={link.user_id} />
}
