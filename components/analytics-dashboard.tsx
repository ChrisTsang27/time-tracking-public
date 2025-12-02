'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend
} from 'recharts'
import { Loader2, TrendingUp, Clock, Activity, PieChart as PieChartIcon, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnalyticsDashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number; fullDate: string }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ date: string; hours: number }[]>([])
  const [distributionData, setDistributionData] = useState<{ name: string; value: number }[]>([])

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
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }).reverse()

    const weeklyChartData = last7Days.map(date => {
      const dayLogs = data.filter(log => log.date === date)
      const dayHours = dayLogs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
      return {
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        hours: dayHours
      }
    })
    setWeeklyData(weeklyChartData)

    // 3. Monthly Activity (Last 30 Days)
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }).reverse()

    const monthlyChartData = last30Days.map(date => {
      const dayLogs = data.filter(log => log.date === date)
      const dayHours = dayLogs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
      return {
        date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        fullDate: date,
        hours: dayHours
      }
    })
    setMonthlyData(monthlyChartData)

    // 4. Category Distribution
    const categoryMap = new Map<string, number>()
    
    data.forEach(log => {
      const category = log.category || 'Uncategorized'
      categoryMap.set(category, (categoryMap.get(category) || 0) + (Number(log.hours) || 0))
    })

    const distributionChartData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    setDistributionData(distributionChartData)
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
          <p className="text-gray-400 text-xs mb-1">{payload[0].payload.fullDate || payload[0].name}</p>
          <p className="text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {payload[0].value.toFixed(1)} hours
          </p>
        </div>
      )
    }
    return null
  }

  const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white neon-text tracking-tight">
              {totalHours.toFixed(1)}<span className="text-xl text-gray-500 dark:text-gray-400 font-normal ml-1">h</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-600 dark:text-green-400" />
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
        className="md:col-span-1"
      >
        <Card className="glass-panel border-purple-500/20 h-full relative overflow-hidden hover:border-purple-500/40 transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] p-2">
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
                <Bar dataKey="hours" radius={[2, 2, 0, 0]} maxBarSize={12} animationDuration={1500}>
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

      {/* Monthly Activity (Line Chart) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="md:col-span-1"
      >
        <Card className="glass-panel border-pink-500/20 h-full relative overflow-hidden hover:border-pink-500/40 transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  interval={6}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value: number) => `${value}h`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#ec4899" 
                  strokeWidth={1.5} 
                  dot={false} 
                  activeDot={{ r: 4, fill: '#ec4899', stroke: '#fff' }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Distribution (Pie Chart) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="md:col-span-1"
      >
        <Card className="glass-panel border-green-500/20 h-full relative overflow-hidden hover:border-green-500/40 transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-green-400" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
