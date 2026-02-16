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
  const safeStart = Math.max(0, Math.min(100, zoneStart))
  const safeEnd = Math.max(safeStart, Math.min(100, zoneEnd))
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
        <span className="whitespace-nowrap">{leftLabel}</span>
        <div className="relative flex-1 h-[1px] bg-gray-700 dark:bg-gray-300 rounded">
          <span
            className="absolute top-1/2 -translate-y-1/2 h-[6px] rounded shadow-[0_0_0_1px_rgba(167,139,250,0.15)]"
            style={{
              left: `${safeStart}%`,
              width: `${safeEnd - safeStart}%`,
              backgroundImage: `linear-gradient(90deg, ${lineColor}, #8b5cf6)`,
            }}
          />
        </div>
        <span className="whitespace-nowrap">{rightLabel}</span>
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
  const FIXED_SEGMENT_WIDTH = 20
  const clampRange = (start: number, end: number): { start: number; end: number } => {
    const midpoint = (start + end) / 2
    const left = Math.max(0, Math.min(100 - FIXED_SEGMENT_WIDTH, midpoint - FIXED_SEGMENT_WIDTH / 2))
    return {
      start: left,
      end: left + FIXED_SEGMENT_WIDTH,
    }
  }

  const yRawStart = Math.max(0, Math.min(100, youZoneStart ?? 35))
  const yRawEnd = Math.max(yRawStart, Math.min(100, youZoneEnd ?? 65))
  const tRawStart = Math.max(0, Math.min(100, themZoneStart ?? 35))
  const tRawEnd = Math.max(tRawStart, Math.min(100, themZoneEnd ?? 65))
  const yRange = clampRange(yRawStart, yRawEnd)
  const tRange = clampRange(tRawStart, tRawEnd)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span style={{ color: YOU_COLOR }}>You</span>
        <span style={{ color: THEM_COLOR }}>Them</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
        <span className="whitespace-nowrap">{leftLabel}</span>
        <div className="relative flex-1 h-[1px] bg-gray-700 dark:bg-gray-300 rounded">
          <span
            className="absolute top-1/2 -translate-y-[calc(50%+4px)] h-[6px] rounded shadow-[0_0_0_1px_rgba(236,72,153,0.15)]"
            style={{
              left: `${yRange.start}%`,
              width: `${yRange.end - yRange.start}%`,
              backgroundImage: 'linear-gradient(90deg, #f5d0fe, #d946ef)',
            }}
          />
          <span
            className="absolute top-1/2 -translate-y-[calc(50%-4px)] h-[6px] rounded shadow-[0_0_0_1px_rgba(124,58,237,0.15)]"
            style={{
              left: `${tRange.start}%`,
              width: `${tRange.end - tRange.start}%`,
              backgroundImage: 'linear-gradient(90deg, #ddd6fe, #7c3aed)',
            }}
          />
        </div>
        <span className="whitespace-nowrap">{rightLabel}</span>
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
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 p-4">
      <button
        type="button"
        onClick={onReveal}
        className="w-full text-left flex items-center justify-between gap-3"
      >
        <div className="font-semibold text-gray-900 dark:text-gray-100">{area.title}</div>
        {!expanded && <div className="text-xs text-gray-500 dark:text-gray-400">In words</div>}
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
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
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
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">Deep Insights</h2>
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
