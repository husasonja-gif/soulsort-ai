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
    <ResponsiveContainer width="100%" height={360} className="min-h-[280px] sm:min-h-[360px]">
      <RechartsRadarChart
        data={chartData}
        margin={{ top: 40, bottom: 40, left: 40, right: 40 }}
      >
        <PolarGrid gridType="circle" />
        <PolarAngleAxis 
          dataKey="dimension" 
          tick={{ fontSize: 9, fill: '#4b5563' }}
          className="dark:text-gray-300"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 8, fill: '#999' }}
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








