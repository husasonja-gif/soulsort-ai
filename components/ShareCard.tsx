'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import RadarChart from './RadarChart'
import type { RadarDimensions } from '@/lib/types'

interface ShareCardProps {
  radarData: RadarDimensions
  shareLink: string
}

export default function ShareCard({ radarData, shareLink }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return
    
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      } as any)
      
      const link = document.createElement('a')
      link.download = 'soulsort-radar.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      // Track share action
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'share_clicked',
          event_data: {
            share_method: 'png_download',
          },
        }),
      }).catch(err => console.error('Analytics tracking error:', err))
    } catch (error) {
      console.error('Error generating PNG:', error)
      alert('Failed to generate PNG. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        ref={cardRef}
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        style={{ minHeight: '400px' }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">SoulSort AI</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Curious how we align?</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
          <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center">
            <RadarChart data={radarData} label="Profile" />
          </div>
          <div className="flex-shrink-0 flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg">
            <QRCodeSVG
              value={shareLink}
              size={140}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all font-mono">{shareLink}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">soulsort.ai - privacy-first - Dec 2024</p>
        </div>
      </div>

      <button
        onClick={handleDownloadPNG}
        disabled={downloading}
        className="w-full mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? 'Generating PNG...' : 'Download as PNG'}
      </button>
    </div>
  )
}

