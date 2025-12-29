'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import RadarChartNoLabels from './RadarChartNoLabels'
import type { RadarDimensions } from '@/lib/types'

interface ShareCardProps {
  radarData: RadarDimensions
  shareLink: string
}

export default function ShareCard({ radarData, shareLink }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPNG = async () => {
    if (!cardRef.current) {
      console.error('Card ref not available')
      return
    }
    
    setDownloading(true)
    try {
      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Force white background for PNG
      const originalBg = cardRef.current.style.backgroundColor
      cardRef.current.style.backgroundColor = '#ffffff'
      
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
          removeContainer: false,
          imageTimeout: 15000,
          onclone: (clonedDoc: Document) => {
            // Ensure all SVG elements are visible
            const svgs = clonedDoc.querySelectorAll('svg')
            svgs.forEach((svg: any) => {
              svg.style.display = 'block'
              svg.style.visibility = 'visible'
            })
          },
        } as any)
        
        // Convert to blob for better browser compatibility
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            throw new Error('Failed to create blob from canvas')
          }
          
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.style.display = 'none'
          link.href = url
          link.download = 'soulsort-radar.png'
          
          document.body.appendChild(link)
          
          // Trigger download
          link.click()
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)
          
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
        }, 'image/png', 1.0)
      } finally {
        // Restore original background
        cardRef.current.style.backgroundColor = originalBg
      }
    } catch (error) {
      console.error('Error generating PNG:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate PNG: ${errorMessage}. Please try again.`)
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
          <div className="w-72 h-72 flex-shrink-0 flex items-center justify-center">
            <RadarChartNoLabels data={radarData} label="Profile" />
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

