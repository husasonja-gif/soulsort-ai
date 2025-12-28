'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import type { RadarDimensions } from '@/lib/types'

interface RadarOverlayProps {
  userData: RadarDimensions
  requesterData: RadarDimensions
}

export default function RadarOverlay({ userData, requesterData }: RadarOverlayProps) {
  const chartData = [
    {
      dimension: 'Self Transcendence',
      user: userData.self_transcendence,
      requester: requesterData.self_transcendence,
      fullMark: 100,
    },
    {
      dimension: 'Self Enhancement',
      user: userData.self_enhancement,
      requester: requesterData.self_enhancement,
      fullMark: 100,
    },
    {
      dimension: 'Rooting',
      user: userData.rooting,
      requester: requesterData.rooting,
      fullMark: 100,
    },
    {
      dimension: 'Searching',
      user: userData.searching,
      requester: requesterData.searching,
      fullMark: 100,
    },
    {
      dimension: 'Relational',
      user: userData.relational,
      requester: requesterData.relational,
      fullMark: 100,
    },
    {
      dimension: 'Erotic',
      user: userData.erotic,
      requester: requesterData.erotic,
      fullMark: 100,
    },
    {
      dimension: 'Consent',
      user: userData.consent,
      requester: requesterData.consent,
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
          stroke="#ec4899"
          fill="#ec4899"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Legend />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}




