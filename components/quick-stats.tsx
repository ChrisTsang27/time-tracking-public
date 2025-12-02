'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Target, Zap, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface QuickStatsProps {
  refreshTrigger: number
}

const QuickStats = ({ refreshTrigger }: QuickStatsProps) => {
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
      value: weeklyHours.toFixed(1),
      unit: 'h',
      icon: Calendar,
      bg: 'bg-gradient-to-br from-[hsl(var(--pastel-orange))] to-white dark:from-orange-500/10 dark:to-orange-500/5 shadow-[var(--shadow-orange)]',
      text: 'text-orange-950 dark:text-orange-100',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trend: '+12% then last week' // Placeholder trend
    },
    {
      label: 'This Month',
      value: monthlyHours.toFixed(1),
      unit: 'h',
      icon: TrendingUp,
      bg: 'bg-gradient-to-br from-[hsl(var(--pastel-green))] to-white dark:from-green-500/10 dark:to-green-500/5 shadow-[var(--shadow-green)]',
      text: 'text-green-950 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: '3.4% then last month'
    },
    {
      label: 'Today',
      value: todayHours.toFixed(1),
      unit: 'h',
      icon: Zap,
      bg: 'bg-gradient-to-br from-[hsl(var(--pastel-blue))] to-white dark:from-blue-500/10 dark:to-blue-500/5 shadow-[var(--shadow-blue)]',
      text: 'text-blue-950 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: 'Daily target'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-white/5 rounded-2xl"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className={`p-6 rounded-2xl ${stat.bg} dark:bg-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer dark:shadow-lg dark:shadow-black/20`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-sm font-medium ${stat.text} opacity-80`}>{stat.label}</span>
              <div className={`p-2 rounded-full bg-white/50 dark:bg-white/10 ${stat.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 mb-2">
              <span className={`text-3xl font-bold ${stat.text}`}>
                {stat.value}
              </span>
              <span className={`text-lg font-medium ${stat.text} opacity-70`}>
                {stat.unit}
              </span>
            </div>

            <p className={`text-xs ${stat.text} opacity-60`}>
              {stat.trend}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo(QuickStats, (prevProps, nextProps) => 
  prevProps.refreshTrigger === nextProps.refreshTrigger
)
