'use client'

import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { QRCodeSVG } from 'qrcode.react'
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, ResponsiveContainer } from 'recharts'
import type { RadarDimensions } from '@/lib/types'

interface ShareCardProps {
  radarValues: RadarDimensions
  shareUrl: string
  date: string // e.g., "Dec 2024"
}

export default function ShareCard({ radarValues, shareUrl, date }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Chart data for the radar (without labels/numbers)
  const chartData = [
    { dimension: 'Self Transcendence', value: radarValues.self_transcendence, fullMark: 100 },
    { dimension: 'Self Enhancement', value: radarValues.self_enhancement, fullMark: 100 },
    { dimension: 'Rooting', value: radarValues.rooting, fullMark: 100 },
    { dimension: 'Searching', value: radarValues.searching, fullMark: 100 },
    { dimension: 'Relational', value: radarValues.relational, fullMark: 100 },
    { dimension: 'Erotic', value: radarValues.erotic, fullMark: 100 },
    { dimension: 'Consent', value: radarValues.consent, fullMark: 100 },
  ]

  // Export as PNG using html2canvas
  const exportAsPNG = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        width: 800,
        height: 1000,
        useCORS: true,
        allowTaint: false,
      })

      // Download
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `soulsort-radar-${date.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = url
      link.click()
    } catch (error) {
      console.error('Error exporting card:', error)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Share card (4:5 aspect ratio) */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-b from-purple-50 to-pink-50 rounded-lg overflow-hidden"
        style={{ width: '800px', height: '1000px', aspectRatio: '4/5' }}
      >
        {/* Logo */}
        <div className="absolute top-12 left-0 right-0 text-center">
          <h1 className="text-5xl font-bold text-purple-600">SoulSort AI</h1>
        </div>

        {/* Headline (14px spacing after logo) */}
        <div className="absolute" style={{ top: '112px', left: 0, right: 0 }}>
          <p className="text-3xl text-gray-700 font-medium text-center">Curious how we align?</p>
        </div>

        {/* Radar Chart (central, dominant, 28px spacing after headline) */}
        <div className="absolute" style={{ top: '184px', left: 0, right: 0, height: '520px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart 
              data={chartData} 
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              outerRadius="90%"
            >
              <PolarGrid stroke="#e5e7eb" />
              <Radar
                dataKey="value"
                stroke="#9333ea"
                fill="#9333ea"
                fillOpacity={0.3}
                strokeWidth={3}
                dot={false}
              />
              {/* No PolarAngleAxis or PolarRadiusAxis to hide labels/numbers */}
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>

        {/* QR + URL (28px spacing after radar, side by side) */}
        <div className="absolute bottom-28 left-0 right-0 flex items-start justify-center gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg mb-2">
              <QRCodeSVG
                value={shareUrl}
                size={128}
                level="H"
                includeMargin={false}
                fgColor="#9333ea"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-sm text-gray-600 font-medium">Scan to compare</p>
          </div>
          <div className="flex items-center" style={{ height: '148px' }}>
            <p className="text-purple-600 font-semibold text-lg">{shareUrl}</p>
          </div>
        </div>

        {/* Footer (24px spacing after QR/URL) */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-sm text-gray-500">
            SoulSort AI · privacy-first · {date}
          </p>
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={exportAsPNG}
        className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
      >
        Download as PNG
      </button>
    </div>
  )
}

