'use client'

interface BMNLRadarChartProps {
  data: {
    participation: 'low' | 'emerging' | 'stable' | 'mastering'
    consent_literacy: 'low' | 'emerging' | 'stable' | 'mastering'
    communal_responsibility: 'low' | 'emerging' | 'stable' | 'mastering'
    inclusion_awareness: 'low' | 'emerging' | 'stable' | 'mastering'
    self_regulation: 'low' | 'emerging' | 'stable' | 'mastering'
    openness_to_learning: 'low' | 'emerging' | 'stable' | 'mastering'
  }
}

export default function BMNLRadarChart({ data }: BMNLRadarChartProps) {
  const dimensions = [
    { key: 'participation', label: 'Participation' },
    { key: 'consent_literacy', label: 'Consent Literacy' },
    { key: 'communal_responsibility', label: 'Communal Responsibility' },
    { key: 'inclusion_awareness', label: 'Inclusion Awareness' },
    { key: 'self_regulation', label: 'Self-Regulation' },
    { key: 'openness_to_learning', label: 'Openness to Learning' },
  ]

  const getValue = (level: 'low' | 'emerging' | 'stable' | 'mastering'): number => {
    switch (level) {
      case 'low': return 1
      case 'emerging': return 2
      case 'stable': return 3
      case 'mastering': return 4
      default: return 2
    }
  }

  const centerX = 550
  const centerY = 550
  const maxRadius = 350
  // 4 rings: low, emerging, stable, mastering
  const ring1Radius = maxRadius / 4 // Level 1: low
  const ring2Radius = maxRadius / 2 // Level 2: emerging
  const ring3Radius = (maxRadius * 3) / 4 // Level 3: stable
  const ring4Radius = maxRadius // Level 4: mastering

  const angleStep = (2 * Math.PI) / dimensions.length

  // Calculate points for each dimension
  const points = dimensions.map((dim, index) => {
    const angle = (index * angleStep) - (Math.PI / 2) // Start at top
    const value = getValue(data[dim.key as keyof typeof data])
    // Map to 4 rings: 1=low, 2=emerging, 3=stable, 4=mastering
    let radius: number
    switch (value) {
      case 1: radius = ring1Radius; break
      case 2: radius = ring2Radius; break
      case 3: radius = ring3Radius; break
      case 4: radius = ring4Radius; break
      default: radius = ring2Radius; break
    }
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    return { x, y, angle, label: dim.label, value }
  })

  // Create path for the radar shape
  const pathData = points.map((point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
  }).join(' ') + ' Z'

  return (
    <div className="flex flex-col items-center w-full overflow-visible px-2 sm:px-4">
      <svg 
        width="1100" 
        height="1100" 
        viewBox="0 0 1100 1100" 
        className="mb-4"
        style={{ width: '100%', maxWidth: '1100px', height: 'auto', overflow: 'visible', display: 'block', margin: '0 auto' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background circles (4 rings) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ring1Radius}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={ring2Radius}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={ring3Radius}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={ring4Radius}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Axis lines */}
        {points.map((point, index) => (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={centerX + ring4Radius * Math.cos(point.angle)}
            y2={centerY + ring4Radius * Math.sin(point.angle)}
            stroke="#9ca3af"
            strokeWidth="1"
          />
        ))}

        {/* Radar shape */}
        <path
          d={pathData}
          fill="rgba(147, 51, 234, 0.2)"
          stroke="#9333ea"
          strokeWidth="2"
        />

        {/* Dimension labels - positioned further out with better spacing and wrapping */}
        {points.map((point, index) => {
          const labelRadius = ring4Radius + 120
          const labelX = centerX + labelRadius * Math.cos(point.angle)
          const labelY = centerY + labelRadius * Math.sin(point.angle)
          
          // Adjust text anchor and positioning based on angle to prevent cutoff
          let textAnchor: 'start' | 'middle' | 'end' = 'middle'
          let dx = 0
          let dy = 0
          
          // Top and bottom: center anchor
          if (point.angle > -Math.PI / 3 && point.angle < Math.PI / 3) {
            textAnchor = 'middle'
            dy = point.angle < 0 ? -10 : 10 // Slight vertical offset
          }
          // Right side: start anchor
          else if (point.angle >= Math.PI / 3 && point.angle <= (2 * Math.PI) / 3) {
            textAnchor = 'start'
            dx = 8
          }
          // Left side: end anchor - add more space to prevent cutoff
          else {
            textAnchor = 'end'
            dx = -15
          }
          
          // Split long labels into words for better wrapping
          const words = point.label.split(' ')
          const lineHeight = 24
          
          return (
            <g key={index}>
              {words.length > 1 ? (
                // Multi-word labels: stack vertically
                words.map((word, wordIndex) => (
                  <text
                    key={wordIndex}
                    x={labelX + dx}
                    y={labelY + dy + (wordIndex - (words.length - 1) / 2) * lineHeight}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    className="font-semibold fill-gray-800"
                    style={{ 
                      fontSize: '20px',
                    }}
                  >
                    {word}
                  </text>
                ))
              ) : (
                // Single word labels
                <text
                  x={labelX + dx}
                  y={labelY + dy}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="font-semibold fill-gray-800"
                  style={{ 
                    fontSize: '22px',
                  }}
                >
                  {point.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="#9333ea"
        />
      </svg>
    </div>
  )
}

