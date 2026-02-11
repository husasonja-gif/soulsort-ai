'use client'

import { useMemo, useState } from 'react'
import type { RadarDimensions } from '@/lib/types'
import { buildComparisonDeepInsights, buildUserDeepInsights, type DeepInsightArea } from '@/lib/deepInsights'

interface DeepInsightsSectionProps {
  mode: 'user' | 'requester'
  userRadar: RadarDimensions
  requesterRadar?: RadarDimensions
  userPreferences?: Record<string, number | undefined> | null
  requesterPreferences?: Record<string, number | undefined> | null
}

function DotBar({
  value,
  leftLabel,
  rightLabel,
}: {
  value: number
  leftLabel: string
  rightLabel: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
        <span className="whitespace-nowrap">{leftLabel}</span>
        <div className="relative flex-1 h-[2px] bg-gray-700 dark:bg-gray-300 rounded">
          <span
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-900 dark:bg-white border-2 border-white dark:border-gray-900"
            style={{ left: `calc(${clamped}% - 6px)` }}
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
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          <span className="mr-2">{area.icon}</span>
          {area.title}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          {area.descriptor}
        </span>
      </button>

      <div className="mt-3 space-y-3">
        {mode === 'requester' ? (
          <>
            <div>
              <div className="text-xs text-gray-500 mb-1">You</div>
              <DotBar value={area.youValue} leftLabel={area.leftLabel} rightLabel={area.rightLabel} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Them</div>
              <DotBar value={area.themValue ?? area.youValue} leftLabel={area.leftLabel} rightLabel={area.rightLabel} />
            </div>
          </>
        ) : (
          <DotBar value={area.youValue} leftLabel={area.leftLabel} rightLabel={area.rightLabel} />
        )}

        {area.secondary && (
          <div className="pt-1">
            {mode === 'requester' ? (
              <>
                <div className="text-xs text-gray-500 mb-1">You</div>
                <DotBar
                  value={area.secondary.youValue}
                  leftLabel={area.secondary.leftLabel}
                  rightLabel={area.secondary.rightLabel}
                />
                <div className="text-xs text-gray-500 mt-2 mb-1">Them</div>
                <DotBar
                  value={area.secondary.themValue ?? area.secondary.youValue}
                  leftLabel={area.secondary.leftLabel}
                  rightLabel={area.secondary.rightLabel}
                />
              </>
            ) : (
              <DotBar
                value={area.secondary.youValue}
                leftLabel={area.secondary.leftLabel}
                rightLabel={area.secondary.rightLabel}
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
}: DeepInsightsSectionProps) {
  const [enabled, setEnabled] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const data = useMemo(() => {
    if (mode === 'requester' && requesterRadar) {
      return buildComparisonDeepInsights(userRadar, requesterRadar, userPreferences, requesterPreferences)
    }
    return { areas: buildUserDeepInsights(userRadar, userPreferences), summary: null }
  }, [mode, userRadar, requesterRadar, userPreferences, requesterPreferences])

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">Deep Insights</h2>
        <button
          type="button"
          onClick={() => {
            setEnabled(!enabled)
            if (enabled) setExpandedId(null)
          }}
          className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          {enabled ? 'Hide insights' : 'Reveal insights'}
        </button>
      </div>

      {!enabled ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Reveal to explore tension and flow patterns across pacing, repair, desire, and values.
        </p>
      ) : (
        <div className="space-y-4">
          {mode === 'requester' && data.summary && (
            <div className="rounded-xl border border-purple-100 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Where You Flow</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {(data.summary.flow.length ? data.summary.flow : ['✨ Build on your strongest overlap and keep naming what works.']).map((item, idx) => (
                    <li key={`flow-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Where You&apos;ll Feel Friction</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {(data.summary.friction.length ? data.summary.friction : ['⚡ Low visible friction right now; revisit after real-life stress or conflict.']).map((item, idx) => (
                    <li key={`friction-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Creative Edges</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-1">
                  {data.summary.creativeEdges.map((item, idx) => (
                    <li key={`edge-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {data.areas.map((area) => (
            <InsightCard
              key={area.id}
              area={area}
              mode={mode}
              expanded={expandedId === area.id}
              onToggle={() => setExpandedId(expandedId === area.id ? null : area.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
