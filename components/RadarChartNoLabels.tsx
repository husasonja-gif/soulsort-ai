'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { RadarDimensions } from '@/lib/types'

interface RadarChartNoLabelsProps {
  data: RadarDimensions
  label?: string
  color?: string
}

export default function RadarChartNoLabels({ data, label = 'Profile', color = '#9333ea' }: RadarChartNoLabelsProps) {
  const chartData = [
    {
      dimension: 'Self Transcendence',
      value: data.self_transcendence,
      fullMark: 100,
    },
    {
      dimension: 'Self Enhancement',
      value: data.self_enhancement,
      fullMark: 100,
    },
    {
      dimension: 'Rooting',
      value: data.rooting,
      fullMark: 100,
    },
    {
      dimension: 'Searching',
      value: data.searching,
      fullMark: 100,
    },
    {
      dimension: 'Relational',
      value: data.relational,
      fullMark: 100,
    },
    {
      dimension: 'Erotic',
      value: data.erotic,
      fullMark: 100,
    },
    {
      dimension: 'Consent',
      value: data.consent,
      fullMark: 100,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={chartData}>
        <PolarGrid />
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




