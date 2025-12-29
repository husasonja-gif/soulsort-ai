'use client'

import { useState } from 'react'
import RadarChart from '@/components/RadarChart'
import type { RadarDimensions } from '@/lib/types'

interface ArchetypeTableProps {
  archetypes: {
    signature: string
    count: number
    percentage: number
    median: { st: number; se: number; root: number; search: number; rel: number; ero: number; con: number }
  }[]
}

export default function ArchetypeTable({ archetypes }: ArchetypeTableProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<number | null>(null)
  
  if (!archetypes || archetypes.length === 0) {
    return <div className="text-gray-500">No archetype data available</div>
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Top Archetype Signatures</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left p-2 dark:text-gray-300">Signature</th>
              <th className="text-right p-2 dark:text-gray-300">Count</th>
              <th className="text-right p-2 dark:text-gray-300">%</th>
            </tr>
          </thead>
          <tbody>
            {archetypes.map((arch, idx) => (
              <tr
                key={idx}
                className={`border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedArchetype === idx ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
                onClick={() => setSelectedArchetype(selectedArchetype === idx ? null : idx)}
              >
                <td className="p-2 font-mono text-xs dark:text-gray-300">{arch.signature}</td>
                <td className="text-right p-2 dark:text-gray-300">{arch.count}</td>
                <td className="text-right p-2 dark:text-gray-300">{arch.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedArchetype !== null && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2 dark:text-gray-300">
            Representative Radar: {archetypes[selectedArchetype].signature}
          </h4>
          <div className="h-64">
            <RadarChart
              data={{
                self_transcendence: archetypes[selectedArchetype].median.st,
                self_enhancement: archetypes[selectedArchetype].median.se,
                rooting: archetypes[selectedArchetype].median.root,
                searching: archetypes[selectedArchetype].median.search,
                relational: archetypes[selectedArchetype].median.rel,
                erotic: archetypes[selectedArchetype].median.ero,
                consent: archetypes[selectedArchetype].median.con,
              }}
              label="Archetype"
            />
          </div>
        </div>
      )}
    </div>
  )
}

