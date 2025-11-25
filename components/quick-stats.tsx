'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Target, Zap, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface QuickStatsProps {
  refreshTrigger: number
}

export default function QuickStats({ refreshTrigger }: QuickStatsProps) {
  const [weeklyHours, setWeeklyHours] = useState(0)
  const [monthlyHours, setMonthlyHours] = useState(0)
  const [todayHours, setTodayHours] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get today's date
      const today = new Date().toISOString().split('T')[0]

      // Get this week's start (Monday)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday start
      const monday = new Date(now)
      monday.setDate(now.getDate() - diff)
      const weekStart = monday.toISOString().split('T')[0]

      // Fetch today's hours
      const { data: todayLogs } = await supabase
        .from('time_logs')
        .select('hours')
        .eq('user_id', user.id)
        .eq('date', today)

      if (todayLogs) {
        const todayTotal = todayLogs.reduce((sum, log) => sum + log.hours, 0)
        setTodayHours(todayTotal)
      }

      // Fetch this week's hours
      const { data: weekLogs } = await supabase
        .from('time_logs')
        .select('hours')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', today)

      if (weekLogs) {
        const weekTotal = weekLogs.reduce((sum, log) => sum + log.hours, 0)
        setWeeklyHours(weekTotal)
      }

      // Fetch this month's hours
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const { data: monthLogs } = await supabase
        .from('time_logs')
        .select('hours')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', today)

      if (monthLogs) {
        const monthTotal = monthLogs.reduce((sum, log) => sum + log.hours, 0)
        setMonthlyHours(monthTotal)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: 'This Week',
      value: weeklyHours.toFixed(1) + 'h',
      icon: Calendar,
      color: 'from-blue-400 to-cyan-500',
      bg: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      label: 'This Month',
      value: monthlyHours.toFixed(1) + 'h',
      icon: TrendingUp,
      color: 'from-purple-400 to-pink-500',
      bg: 'from-purple-500/10 to-pink-500/10'
    },
    {
      label: 'Today',
      value: todayHours.toFixed(1) + 'h',
      icon: Zap,
      color: 'from-yellow-400 to-orange-500',
      bg: 'from-yellow-500/10 to-orange-500/10'
    }
  ]

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl border-white/10 animate-pulse">
        <div className="h-8 bg-white/5 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 rounded-xl border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Quick Stats
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`p-4 rounded-lg bg-gradient-to-br ${stat.bg} border border-white/10 hover:border-white/20 transition-all flex items-center justify-center`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`w-5 h-5 mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                <span className="text-xs text-gray-400 mb-1">{stat.label}</span>
                <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent tabular-nums`}>
                  {stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
