'use client'

import { useEffect, useState } from 'react'
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { RadarDimensions } from '@/lib/types'
import { toV4RadarAxes } from '@/lib/radarAxes'

interface RadarOverlayProps {
  userData: RadarDimensions
  requesterData: RadarDimensions
}

const AXIS_DESCRIPTIONS: Record<string, string> = {
  'Meaning & Values':
    "Meaning & Values — How you find purpose: through making the world better, expressing your ambitions, staying grounded in what's familiar, or chasing what's new and unknown.",
  'Erotic Attunement':
    'Erotic Attunement — Your relationship with desire: how you tune into the other, build chemistry, create heat, and discuss wants.',
  'Consent Orientation':
    'Consent Orientation — How you navigate boundaries: speaking up for what you need, reading the room, and staying connected to yourself and the other.',
  'Regulation & Nervous System':
    'Regulation & Nervous System — The way you settle: how you handle emotional flooding, repair after conflict, and find your way back to calm.',
  'Autonomy Orientation':
    "Autonomy Orientation — Your dance between closeness and freedom: how much space you need, how you balance independence with intimacy, and whether you lean toward comfort or novelty.",
  'Conflict & Repair':
    "Conflict & Repair — What happens after a rupture: whether you flee, fight, freeze, or find your way back to connection—and how trust gets rebuilt (or doesn't).",
}

const AXIS_LABEL_LINES: Record<string, string[]> = {
  'Meaning & Values': ['Meaning'],
  'Regulation & Nervous System': ['Calm'],
  'Erotic Attunement': ['Desire'],
  'Autonomy Orientation': ['Autonomy'],
  'Consent Orientation': ['Consent'],
  'Conflict & Repair': ['Repair'],
}

interface AxisTickProps {
  x?: number
  y?: number
  cx?: number
  cy?: number
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  payload?: { value?: string }
  onAxisHover?: (axis: string | null) => void
  labelDistanceMultiplier?: number
  isMobile?: boolean
}

function AxisTick({
  x = 0,
  y = 0,
  cx = 0,
  cy = 0,
  textAnchor = 'middle',
  payload,
  onAxisHover,
  labelDistanceMultiplier = 1.2,
  isMobile = false,
}: AxisTickProps) {
  const key = payload?.value || ''
  const [line1, line2] = AXIS_LABEL_LINES[key] || [key, '']
  const tx = cx + (x - cx) * labelDistanceMultiplier
  const verticalNudge = key === 'Meaning & Values' ? (isMobile ? -10 : -4) : 0
  const ty = cy + (y - cy) * labelDistanceMultiplier + verticalNudge

  return (
    <g
      transform={`translate(${tx},${ty})`}
      className="cursor-help"
      onMouseEnter={() => onAxisHover?.(key)}
      onMouseLeave={() => onAxisHover?.(null)}
    >
      <text textAnchor={textAnchor} fill="#4b5563" className="dark:fill-gray-300 font-medium">
        <tspan x={0} dy={0} fontSize={isMobile ? 11 : 13}>{line1}</tspan>
        {line2 ? <tspan x={0} dy={isMobile ? 13 : 15} fontSize={isMobile ? 11 : 13}>{line2}</tspan> : null}
      </text>
    </g>
  )
}

export default function RadarOverlay({ userData, requesterData }: RadarOverlayProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => {
      setIsMobile(window.innerWidth < 640)
      setIsMounted(true)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const userAxes = toV4RadarAxes(userData)
  const requesterAxes = toV4RadarAxes(requesterData)
  const chartData = [
    {
      dimension: 'Meaning & Values',
      user: userAxes.meaning_values,
      requester: requesterAxes.meaning_values,
      fullMark: 100,
    },
    {
      dimension: 'Regulation & Nervous System',
      user: userAxes.regulation_nervous_system,
      requester: requesterAxes.regulation_nervous_system,
      fullMark: 100,
    },
    {
      dimension: 'Erotic Attunement',
      user: userAxes.erotic_attunement,
      requester: requesterAxes.erotic_attunement,
      fullMark: 100,
    },
    {
      dimension: 'Autonomy Orientation',
      user: userAxes.autonomy_orientation,
      requester: requesterAxes.autonomy_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Consent Orientation',
      user: userAxes.consent_orientation,
      requester: requesterAxes.consent_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Conflict & Repair',
      user: userAxes.conflict_repair,
      requester: requesterAxes.conflict_repair,
      fullMark: 100,
    },
  ]

  const labelDistanceMultiplier = isMobile ? 1.08 : 1.28

  return (
    <div className="relative" style={{ minHeight: isMobile ? 500 : 560 }}>
      {hoveredAxis ? (
        <div
          className={
            isMobile
              ? 'mb-3 w-full rounded-2xl px-3 py-2 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/70 dark:to-purple-800/40 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'absolute z-20 left-1/2 -translate-x-1/2 top-2 max-w-xl rounded-2xl px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/70 dark:to-purple-800/40 text-gray-800 dark:text-gray-100 shadow-sm'
          }
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full border border-purple-400 text-purple-600 text-xs font-bold flex items-center justify-center bg-white/70 dark:bg-gray-900/40">
              i
            </span>
            <p className="text-xs sm:text-sm leading-snug">{AXIS_DESCRIPTIONS[hoveredAxis]}</p>
          </div>
        </div>
      ) : null}

      <ResponsiveContainer width="100%" height={isMobile ? 500 : 620}>
        <RechartsRadarChart
          data={chartData}
          margin={isMobile ? { top: 78, bottom: 130, left: 24, right: 24 } : { top: 110, bottom: 120, left: 90, right: 90 }}
          outerRadius={isMobile ? '75%' : '68%'}
        >
          <PolarGrid gridType="circle" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={(props) => (
              <AxisTick
                {...props}
                onAxisHover={setHoveredAxis}
                labelDistanceMultiplier={isMounted ? labelDistanceMultiplier : 1.2}
                isMobile={isMobile}
              />
            )}
            tickLine={false}
            className="dark:text-gray-300"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: isMobile ? 9 : 10, fill: '#999' }}
          />
          <Radar
            name="Them"
            dataKey="user"
            stroke="#9333ea"
            fill="#9333ea"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="You"
            dataKey="requester"
            stroke="#d946ef"
            fill="#d946ef"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-6 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#9333ea' }} />
          <span className="text-gray-700 dark:text-gray-200">Them</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#d946ef' }} />
          <span className="text-gray-700 dark:text-gray-200">You</span>
        </div>
      </div>
    </div>
  )
}








