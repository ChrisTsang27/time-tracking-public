'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

interface EndOfDayReflectionProps {
  onDismiss: () => void
}

interface LogBreakdown {
  title: string
  category: string
  hours: number
  emoji: string
}

export default function EndOfDayReflection({ onDismiss }: EndOfDayReflectionProps) {
  const [todayHours, setTodayHours] = useState<number>(0)
  const [breakdown, setBreakdown] = useState<LogBreakdown[]>([])
  const [tomorrowPlan, setTomorrowPlan] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayStats()
  }, [])

  const fetchTodayStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      const { data: logs } = await supabase
        .from('time_logs')
        .select('title, category, hours')
        .eq('user_id', user.id)
        .eq('date', today)

      if (logs) {
        const total = logs.reduce((sum, log) => sum + log.hours, 0)
        setTodayHours(total)

        // Group by title and category
        const grouped = logs.reduce((acc: LogBreakdown[], log) => {
          const existing = acc.find(item => item.title === log.title)
          if (existing) {
            existing.hours += log.hours
          } else {
            acc.push({
              title: log.title,
              category: log.category || 'Other',
              hours: log.hours,
              emoji: getCategoryEmoji(log.category)
            })
          }
          return acc
        }, [])

        // Sort by hours descending
        grouped.sort((a, b) => b.hours - a.hours)
        setBreakdown(grouped)
      }
    } catch (error) {
      console.error('Error fetching today stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryEmoji = (category: string | null) => {
    const emojiMap: { [key: string]: string } = {
      'Work': '🎯',
      'Study': '📚',
      'Code': '💻',
      'Meeting': '🤝',
      'Other': '⚙️'
    }
    return emojiMap[category || 'Other'] || '⚙️'
  }

  const handleSavePlan = async () => {
    if (tomorrowPlan.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowDate = tomorrow.toISOString().split('T')[0]

        const { error } = await supabase
          .from('profiles')
          .update({ 
            tomorrow_plan: tomorrowPlan,
            tomorrow_plan_date: tomorrowDate
          })
          .eq('id', user.id)

        if (error) throw error

        toast.success('Tomorrow\'s plan saved!')
        setTimeout(() => onDismiss(), 1000)
      } catch (error) {
        console.error('Error saving plan:', error)
        toast.error('Failed to save plan')
      }
    } else {
      onDismiss()
    }
  }

  if (loading) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="glass-panel border-white/20 p-8 max-w-lg w-full relative overflow-hidden shadow-2xl shadow-purple-500/10">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
            
            {/* Moon icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-4 right-4"
            >
              <Moon className="w-6 h-6 text-indigo-400" />
            </motion.div>

            {/* Content */}
            <div className="relative z-10 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2">
                  End of Day <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Review</span>
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">Today:</span>
                  <span className="text-2xl font-bold text-white">{todayHours.toFixed(1)}h</span>
                  <span className="text-green-400 text-sm">total</span>
                </div>
              </motion.div>

              {/* Breakdown */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                {breakdown.length > 0 ? (
                  breakdown.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-white text-sm">{item.title}</span>
                      </div>
                      <span className="text-blue-400 font-medium">{item.hours.toFixed(1)}h</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No logs for today</p>
                )}
              </motion.div>

              {/* Tomorrow Planning */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 pt-4 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Anything you want to plan for tomorrow?</span>
                </div>
                <Textarea
                  placeholder="E.g., Write contract draft (1h), Trailer inventory check (0.5h)..."
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  className="glass-input bg-black/5 dark:bg-black/40 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[100px] focus:border-blue-500/50 transition-all resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl p-4"
                />
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                <Button
                  onClick={handleSavePlan}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl h-11"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>{tomorrowPlan.trim() ? 'Save & Close' : 'Done'}</span>
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Skip
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
