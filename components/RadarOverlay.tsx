'use client'

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import type { RadarDimensions } from '@/lib/types'
import { toV4RadarAxes } from '@/lib/radarAxes'

interface RadarOverlayProps {
  userData: RadarDimensions
  requesterData: RadarDimensions
}

export default function RadarOverlay({ userData, requesterData }: RadarOverlayProps) {
  const userAxes = toV4RadarAxes(userData)
  const requesterAxes = toV4RadarAxes(requesterData)
  const chartData = [
    {
      dimension: 'Meaning & Values',
      user: userAxes.meaning_values,
      requester: requesterAxes.meaning_values,
      fullMark: 100,
    },
    {
      dimension: 'Regulation & Nervous System',
      user: userAxes.regulation_nervous_system,
      requester: requesterAxes.regulation_nervous_system,
      fullMark: 100,
    },
    {
      dimension: 'Erotic Attunement',
      user: userAxes.erotic_attunement,
      requester: requesterAxes.erotic_attunement,
      fullMark: 100,
    },
    {
      dimension: 'Autonomy Orientation',
      user: userAxes.autonomy_orientation,
      requester: requesterAxes.autonomy_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Consent Orientation',
      user: userAxes.consent_orientation,
      requester: requesterAxes.consent_orientation,
      fullMark: 100,
    },
    {
      dimension: 'Conflict & Repair',
      user: userAxes.conflict_repair,
      requester: requesterAxes.conflict_repair,
      fullMark: 100,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={chartData}>
        <PolarGrid gridType="circle" />
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








