'use client'

import { useMemo, useState } from 'react'
import type { CanonicalSignalScores, RadarDimensions } from '@/lib/types'
import { buildComparisonDeepInsights, buildUserDeepInsights, type DeepInsightArea } from '@/lib/deepInsights'

interface DeepInsightsSectionProps {
  mode: 'user' | 'requester'
  userRadar: RadarDimensions
  requesterRadar?: RadarDimensions
  userPreferences?: Record<string, number | undefined> | null
  requesterPreferences?: Record<string, number | undefined> | null
  userSignalScores?: Partial<CanonicalSignalScores> | null
  requesterSignalScores?: Partial<CanonicalSignalScores> | null
  insightOverrides?: Record<string, string> | null
}

const THEM_COLOR = '#9333ea'
const YOU_COLOR = '#d946ef'

function projectRangeWithNuance(start: number, end: number): { start: number; end: number } {
  const safeStart = Math.max(0, Math.min(100, start))
  const safeEnd = Math.max(safeStart, Math.min(100, end))
  const midpoint = (safeStart + safeEnd) / 2
  const rawWidth = Math.max(0, safeEnd - safeStart)
  const MIN_SEGMENT_WIDTH = 10
  const MAX_SEGMENT_WIDTH = 34
  const normalizedWidth =
    MIN_SEGMENT_WIDTH +
    (Math.min(40, rawWidth) / 40) * (MAX_SEGMENT_WIDTH - MIN_SEGMENT_WIDTH)
  const half = normalizedWidth / 2
  const left = Math.max(0, Math.min(100 - normalizedWidth, midpoint - half))
  return { start: left, end: left + normalizedWidth }
}

function DotBar({
  zoneStart = 35,
  zoneEnd = 65,
  lineColor = '#c4b5fd',
  leftLabel,
  rightLabel,
}: {
  lineColor?: string
  leftLabel: string
  rightLabel: string
  zoneStart?: number
  zoneEnd?: number
}) {
  const range = projectRangeWithNuance(zoneStart, zoneEnd)
  return (
    <div className="space-y-1">
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-200">
        <span className="whitespace-nowrap">{leftLabel}</span>
        <div className="relative flex-1 min-w-[110px] h-[2px] bg-white/20 rounded">
          <span
            className="absolute top-1/2 -translate-y-1/2 h-[8px] rounded-full shadow-[0_0_8px_rgba(192,132,252,0.6)]"
            style={{
              left: `${range.start}%`,
              width: `${range.end - range.start}%`,
              backgroundImage: `linear-gradient(90deg, #e879f9, #a855f7)`,
            }}
          />
        </div>
        <span className="whitespace-nowrap">{rightLabel}</span>
      </div>
      <div className="sm:hidden space-y-1">
        <div className="relative h-[2px] bg-white/20 rounded">
          <span
            className="absolute top-1/2 -translate-y-1/2 h-[8px] rounded-full shadow-[0_0_8px_rgba(192,132,252,0.6)]"
            style={{
              left: `${range.start}%`,
              width: `${range.end - range.start}%`,
              backgroundImage: `linear-gradient(90deg, #e879f9, #a855f7)`,
            }}
          />
        </div>
        <div className="flex items-start justify-between gap-3 text-[12px] text-gray-200">
          <span className="leading-tight">{leftLabel}</span>
          <span className="text-right leading-tight">{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

function ComparisonBar({
  leftLabel,
  rightLabel,
  youZoneStart,
  youZoneEnd,
  themZoneStart,
  themZoneEnd,
}: {
  leftLabel: string
  rightLabel: string
  youZoneStart?: number
  youZoneEnd?: number
  themZoneStart?: number
  themZoneEnd?: number
}) {
  const yRawStart = Math.max(0, Math.min(100, youZoneStart ?? 35))
  const yRawEnd = Math.max(yRawStart, Math.min(100, youZoneEnd ?? 65))
  const tRawStart = Math.max(0, Math.min(100, themZoneStart ?? 35))
  const tRawEnd = Math.max(tRawStart, Math.min(100, themZoneEnd ?? 65))
  const yRange = projectRangeWithNuance(yRawStart, yRawEnd)
  const tRange = projectRangeWithNuance(tRawStart, tRawEnd)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span style={{ color: '#f472b6' }}>You</span>
        <span style={{ color: '#a855f7' }}>Them</span>
      </div>
      <div className="space-y-1">
        <div className="relative h-[2px] bg-white/20 rounded">
          <span
            className="absolute top-1/2 -translate-y-[calc(50%+5px)] h-[8px] rounded-full shadow-[0_0_8px_rgba(244,114,182,0.7)]"
            style={{
              left: `${yRange.start}%`,
              width: `${yRange.end - yRange.start}%`,
              backgroundImage: 'linear-gradient(90deg, #f9a8d4, #f472b6)',
            }}
          />
          <span
            className="absolute top-1/2 -translate-y-[calc(50%-5px)] h-[8px] rounded-full shadow-[0_0_8px_rgba(168,85,247,0.7)]"
            style={{
              left: `${tRange.start}%`,
              width: `${tRange.end - tRange.start}%`,
              backgroundImage: 'linear-gradient(90deg, #c4b5fd, #a855f7)',
            }}
          />
        </div>
        <div className="flex items-start justify-between gap-3 text-[12px] text-gray-200">
          <span className="leading-tight">{leftLabel}</span>
          <span className="text-right leading-tight">{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

function InsightCard({
  area,
  mode,
  expanded,
  onReveal,
}: {
  area: DeepInsightArea
  mode: 'user' | 'requester'
  expanded: boolean
  onReveal: () => void
}) {
  return (
    <div className="border border-purple-300/20 rounded-xl bg-gray-900/60 p-4">
      <button
        type="button"
        onClick={onReveal}
        className="w-full text-left flex items-center justify-between gap-3"
      >
        <div className="font-bold text-white">{area.title}</div>
        {!expanded && <div className="text-xs text-purple-300 font-medium">In words</div>}
      </button>

      <div className="mt-3 space-y-3">
        {mode === 'requester' ? (
          <>
            <ComparisonBar
              leftLabel={area.leftLabel}
              rightLabel={area.rightLabel}
              youZoneStart={area.zoneStart}
              youZoneEnd={area.zoneEnd}
              themZoneStart={area.themZoneStart ?? area.zoneStart}
              themZoneEnd={area.themZoneEnd ?? area.zoneEnd}
            />
          </>
        ) : (
          <DotBar
            leftLabel={area.leftLabel}
            rightLabel={area.rightLabel}
            zoneStart={area.zoneStart}
            zoneEnd={area.zoneEnd}
            lineColor="#c4b5fd"
          />
        )}

        {area.secondary && (
          <div className="pt-1">
            {mode === 'requester' ? (
              <>
                <ComparisonBar
                  leftLabel={area.secondary.leftLabel}
                  rightLabel={area.secondary.rightLabel}
                  youZoneStart={area.secondary.zoneStart}
                  youZoneEnd={area.secondary.zoneEnd}
                  themZoneStart={area.secondary.themZoneStart ?? area.secondary.zoneStart}
                  themZoneEnd={area.secondary.themZoneEnd ?? area.secondary.zoneEnd}
                />
              </>
            ) : (
              <DotBar
                leftLabel={area.secondary.leftLabel}
                rightLabel={area.secondary.rightLabel}
                zoneStart={area.secondary.zoneStart}
                zoneEnd={area.secondary.zoneEnd}
                lineColor="#c4b5fd"
              />
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 text-sm text-gray-300 leading-relaxed border-t border-purple-300/20 pt-4">
          {area.insight}
        </div>
      )}
    </div>
  )
}

export default function DeepInsightsSection({
  mode,
  userRadar,
  requesterRadar,
  userPreferences,
  requesterPreferences,
  userSignalScores,
  requesterSignalScores,
  insightOverrides,
}: DeepInsightsSectionProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})

  const data = useMemo(() => {
    if (mode === 'requester' && requesterRadar) {
      return buildComparisonDeepInsights(
        userRadar,
        requesterRadar,
        userPreferences,
        requesterPreferences,
        userSignalScores,
        requesterSignalScores
      )
    }
    return { areas: buildUserDeepInsights(userRadar, userPreferences, userSignalScores), summary: null }
  }, [mode, userRadar, requesterRadar, userPreferences, requesterPreferences, userSignalScores, requesterSignalScores])

  return (
    <section className="bg-white/10 backdrop-blur-xl rounded-2xl border border-purple-300/20 p-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-purple-300">Deep Insights</h2>
      </div>

      <div className="space-y-4">
          {data.areas.map((area) => (
            <InsightCard
              key={area.id}
              area={{
                ...area,
                insight: insightOverrides?.[area.id] || area.insight,
              }}
              mode={mode}
              expanded={!!revealedIds[area.id]}
              onReveal={() => {
                setRevealedIds((prev) => (prev[area.id] ? prev : { ...prev, [area.id]: true }))
              }}
            />
          ))}
      </div>
    </section>
  )
}
