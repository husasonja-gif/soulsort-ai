'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface WordCountChartProps {
  missingRate: { q1: number; q2: number; q3: number; q4: number }
  wordCountBins: Record<string, { '0': number; '1-5': number; '6-15': number; '16-30': number; '31+': number }>
}

export default function WordCountChart({ missingRate, wordCountBins }: WordCountChartProps) {
  const missingData = [
    { question: 'Q1', rate: missingRate.q1 * 100 },
    { question: 'Q2', rate: missingRate.q2 * 100 },
    { question: 'Q3', rate: missingRate.q3 * 100 },
    { question: 'Q4', rate: missingRate.q4 * 100 },
  ]
  
  const wordCountData = ['q1', 'q2', 'q3', 'q4'].map(q => ({
    question: q.toUpperCase(),
    '0': wordCountBins[q]?.['0'] || 0,
    '1-5': wordCountBins[q]?.['1-5'] || 0,
    '6-15': wordCountBins[q]?.['6-15'] || 0,
    '16-30': wordCountBins[q]?.['16-30'] || 0,
    '31+': wordCountBins[q]?.['31+'] || 0,
  }))
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Missing Rate & Word Count Distribution</h3>
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Missing Rate by Question</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={missingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="question" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Bar dataKey="rate" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Word Count Distribution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={wordCountData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="question" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="0" stackId="a" fill="#ef4444" />
            <Bar dataKey="1-5" stackId="a" fill="#f97316" />
            <Bar dataKey="6-15" stackId="a" fill="#eab308" />
            <Bar dataKey="16-30" stackId="a" fill="#22c55e" />
            <Bar dataKey="31+" stackId="a" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

