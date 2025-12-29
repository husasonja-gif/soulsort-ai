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
        scale: 2,
        logging: false,
        useCORS: true,
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
    <div className="w-full max-w-md mx-auto">
      <div
        ref={cardRef}
        className="bg-white p-4 sm:p-6 rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-purple-600 mb-1">SoulSort AI</h2>
          <p className="text-gray-600 text-sm">Curious how we align?</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <div className="w-full sm:w-48 h-48 sm:h-48 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full scale-75 sm:scale-100">
              <RadarChart data={radarData} label="Profile" />
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center">
            <QRCodeSVG
              value={shareLink}
              size={120}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 break-all">{shareLink}</p>
          <p className="text-xs text-gray-400 mt-1">soulsort.ai - privacy-first - Dec 2024</p>
        </div>
      </div>

      <button
        onClick={handleDownloadPNG}
        disabled={downloading}
        className="w-full mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {downloading ? 'Generating...' : 'Download as PNG'}
      </button>
    </div>
  )
}

