'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import type { RadarDimensions } from '@/lib/types'
import { toV4RadarAxes } from '@/lib/radarAxes'

interface RadarChartProps {
  data: RadarDimensions
  label?: string
  color?: string
  showLegend?: boolean
}

const AXIS_DESCRIPTIONS: Record<string, string> = {
  'Meaning & Values': 'How you find purpose: impact, ambition, grounding, and exploration.',
  'Regulation & Nervous System': 'How you settle, regulate, and repair under stress.',
  'Erotic Attunement': 'How desire, chemistry, and erotic responsiveness show up for you.',
  'Autonomy Orientation': 'How you balance freedom and closeness in relationships.',
  'Consent Orientation': 'How you navigate boundaries, advocacy, and relational safety.',
  'Conflict & Repair': 'How you move through rupture and rebuild connection.',
}

const AXIS_LABEL_LINES: Record<string, string[]> = {
  'Meaning & Values': ['Meaning', '& Values'],
  'Regulation & Nervous System': ['Regulation &', 'Nervous System'],
  'Erotic Attunement': ['Erotic', 'Attunement'],
  'Autonomy Orientation': ['Autonomy', 'Orientation'],
  'Consent Orientation': ['Consent', 'Orientation'],
  'Conflict & Repair': ['Conflict &', 'Repair'],
}

interface AxisTickProps {
  x?: number
  y?: number
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  payload?: { value?: string }
}

function AxisTick({ x = 0, y = 0, textAnchor = 'middle', payload }: AxisTickProps) {
  const key = payload?.value || ''
  const [line1, line2] = AXIS_LABEL_LINES[key] || [key, '']
  const description = AXIS_DESCRIPTIONS[key] || key

  return (
    <g transform={`translate(${x},${y})`} className="cursor-help">
      <title>{description}</title>
      <text textAnchor={textAnchor} fill="#4b5563" className="dark:fill-gray-300 font-medium">
        <tspan x={0} dy={0} fontSize={13}>{line1}</tspan>
        {line2 ? <tspan x={0} dy={15} fontSize={13}>{line2}</tspan> : null}
      </text>
    </g>
  )
}

export default function RadarChart({ data, label = 'Profile', color = '#9333ea', showLegend = false }: RadarChartProps) {
  const axes = toV4RadarAxes(data)
  const chartData = [
    {
      dimension: 'Meaning & Values',
      value: axes.meaning_values,
      fullMark: 100,
    },
    {
      dimension: 'Regulation & Nervous System',
      value: axes.regulation_nervous_system,
      fullMark: 100,
    },
    {
      dimension: 'Erotic Attunement',
      value: axes.erotic_attunement,
      fullMark: 100,
    },
    {
      dimension: 'Autonomy Orientation',
      value: axes.autonomy_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Consent Orientation',
      value: axes.consent_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Conflict & Repair',
      value: axes.conflict_repair,
      fullMark: 100,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={560} className="min-h-[420px] sm:min-h-[560px]">
      <RechartsRadarChart
        data={chartData}
        margin={{ top: 90, bottom: 90, left: 80, right: 80 }}
      >
        <PolarGrid gridType="circle" />
        <PolarAngleAxis 
          dataKey="dimension" 
          tick={<AxisTick />}
          tickLine={false}
          className="dark:text-gray-300"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 11, fill: '#999' }}
        />
        <Radar
          name={label}
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        {showLegend && <Legend />}
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}








