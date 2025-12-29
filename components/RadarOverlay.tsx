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
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="dimension" 
          tick={{ fontSize: 12, fill: '#666' }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 10, fill: '#999' }}
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



