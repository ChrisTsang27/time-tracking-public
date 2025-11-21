'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, TrendingUp, Clock, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnalyticsDashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number; fullDate: string }[]>([])

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('date', { ascending: true })

    if (!error && data) {
      const logsData = data as TimeLog[]
      setLogs(logsData)
      calculateStats(logsData)
    }
    setLoading(false)
  }

  const calculateStats = (data: TimeLog[]) => {
    // 1. Total Hours
    const total = data.reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
    setTotalHours(total)

    // 2. Weekly Activity (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      // Use local time YYYY-MM-DD
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }).reverse()

    const chartData = last7Days.map(date => {
      const dayLogs = data.filter(log => log.date === date)
      const dayHours = dayLogs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
      return {
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
        fullDate: date,
        hours: dayHours
      }
    })

    setWeeklyData(chartData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 glass-panel rounded-xl">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-gray-400 text-xs mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {payload[0].value} hours
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Hours Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="md:col-span-1"
      >
        <Card className="glass-panel border-blue-500/20 h-full relative overflow-hidden group hover:border-blue-500/40 transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Total Hours Logged
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold text-white neon-text tracking-tight">
              {totalHours.toFixed(1)}<span className="text-xl text-gray-500 font-normal ml-1">h</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-400" />
              Lifetime productivity
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="md:col-span-2"
      >
        <Card className="glass-panel border-purple-500/20 h-full relative overflow-hidden hover:border-purple-500/40 transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value: number) => `${value}h`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1500}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradient-${index})`} />
                  ))}
                </Bar>
                <defs>
                  {weeklyData.map((entry, index) => (
                    <linearGradient key={`grad-${index}`} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
