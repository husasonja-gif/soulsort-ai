'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { RadarDimensions } from '@/lib/types'
import { toV4RadarAxes } from '@/lib/radarAxes'

interface RadarChartNoLabelsProps {
  data: RadarDimensions
  label?: string
  color?: string
}

export default function RadarChartNoLabels({ data, label = 'Profile', color = '#9333ea' }: RadarChartNoLabelsProps) {
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
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={chartData}>
        <PolarGrid gridType="circle" />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={false}
          axisLine={false}
        />
        <Radar
          name={label}
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}





