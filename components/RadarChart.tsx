'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import type { RadarDimensions } from '@/lib/types'

interface RadarChartProps {
  data: RadarDimensions
  label?: string
  color?: string
  showLegend?: boolean
}

export default function RadarChart({ data, label = 'Profile', color = '#9333ea', showLegend = false }: RadarChartProps) {
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
    <ResponsiveContainer width="100%" height={350} className="sm:h-[400px]">
      <RechartsRadarChart data={chartData}>
        <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <PolarAngleAxis 
          dataKey="dimension" 
          tick={{ fontSize: 11, fill: '#666', className: 'dark:fill-gray-300' }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 9, fill: '#999', className: 'dark:fill-gray-400' }}
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




