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
  const yStart = Math.max(0, Math.min(100, youZoneStart ?? 35))
  const yEnd = Math.max(yStart, Math.min(100, youZoneEnd ?? 65))
  const tStart = Math.max(0, Math.min(100, themZoneStart ?? 35))
  const tEnd = Math.max(tStart, Math.min(100, themZoneEnd ?? 65))

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
            className="absolute top-1/2 -translate-y-[calc(50%+4px)] h-[6px] rounded"
            style={{
              left: `${yStart}%`,
              width: `${yEnd - yStart}%`,
              backgroundImage: `linear-gradient(90deg, ${YOU_COLOR}, #f472b6)`,
            }}
          />
          <span
            className="absolute top-1/2 -translate-y-[calc(50%-4px)] h-[6px] rounded"
            style={{
              left: `${tStart}%`,
              width: `${tEnd - tStart}%`,
              backgroundImage: `linear-gradient(90deg, ${THEM_COLOR}, #7c3aed)`,
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
  onToggle,
}: {
  area: DeepInsightArea
  mode: 'user' | 'requester'
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 p-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-center justify-between gap-3"
      >
        <div className="font-semibold text-gray-900 dark:text-gray-100">{area.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{expanded ? 'Hide practical tip' : 'Show practical tip'}</div>
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
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
          {mode === 'requester' && data.summary && (
            <div className="rounded-xl border border-purple-100 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Where You Flow</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {(data.summary.flow.length ? data.summary.flow : ['✨ Build on your strongest overlap and keep naming what works.']).map((item, idx) => (
                      <li key={`flow-${idx}`}>{item.replace(/^[^\w]+/, '')}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Where You&apos;ll Feel Friction</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {(data.summary.friction.length ? data.summary.friction : ['⚡ Low visible friction right now; revisit after real-life stress or conflict.']).map((item, idx) => (
                      <li key={`friction-${idx}`}>{item.replace(/^[^\w]+/, '')}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Creative Edges</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {data.summary.creativeEdges.map((item, idx) => (
                    <li key={`edge-${idx}`}>{item.replace(/^[^\w]+/, '')}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {data.areas.map((area) => (
            <InsightCard
              key={area.id}
              area={{
                ...area,
                insight: insightOverrides?.[area.id] || area.insight,
              }}
              mode={mode}
              expanded={expandedId === area.id}
              onToggle={() => setExpandedId(expandedId === area.id ? null : area.id)}
            />
          ))}
      </div>
    </section>
  )
}
