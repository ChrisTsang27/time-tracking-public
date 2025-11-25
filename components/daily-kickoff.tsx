'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Sunset, ArrowRight, Sparkles } from 'lucide-react'

interface DailyKickoffProps {
  userName: string
  onStartTask: () => void
  onDismiss: () => void
}

export default function DailyKickoff({ userName, onStartTask, onDismiss }: DailyKickoffProps) {
  const [yesterdayHours, setYesterdayHours] = useState<number>(0)
  const [tomorrowPlan, setTomorrowPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchYesterdayStats()
    loadTomorrowPlan()
  }, [])

  const loadTomorrowPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      const { data: profile } = await supabase
        .from('profiles')
        .select('tomorrow_plan, tomorrow_plan_date')
        .eq('id', user.id)
        .single()

      if (profile && profile.tomorrow_plan && profile.tomorrow_plan_date === today) {
        setTomorrowPlan(profile.tomorrow_plan)
        
        // Clear it after loading so it doesn't show tomorrow
        await supabase
          .from('profiles')
          .update({ tomorrow_plan: null, tomorrow_plan_date: null })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Error loading plan:', error)
    }
  }

  const fetchYesterdayStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const { data: logs } = await supabase
        .from('time_logs')
        .select('hours')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr)

      if (logs) {
        const total = logs.reduce((sum, log) => sum + log.hours, 0)
        setYesterdayHours(total)
      }
    } catch (error) {
      console.error('Error fetching yesterday stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'from-yellow-400 to-orange-500' }
    if (hour < 18) return { text: 'Good Afternoon', icon: Sun, color: 'from-orange-400 to-pink-500' }
    return { text: 'Good Evening', icon: Moon, color: 'from-purple-400 to-blue-500' }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon
  const firstName = userName.split('@')[0].split('.')[0]
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

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
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="glass-panel border-white/20 p-8 max-w-lg w-full relative overflow-hidden">
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${greeting.color} opacity-5`} />
            
            {/* Sparkle effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-4 right-4"
            >
              <Sparkles className={`w-6 h-6 text-yellow-400`} />
            </motion.div>

            {/* Content */}
            <div className="relative z-10 space-y-6">
              {/* Greeting */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className={`p-3 rounded-full bg-gradient-to-br ${greeting.color} bg-opacity-20 backdrop-blur-sm`}>
                  <GreetingIcon className={`w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r ${greeting.color}`} />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  {greeting.text}, <span className={`bg-gradient-to-r ${greeting.color} bg-clip-text text-transparent`}>{capitalizedName}</span>
                </h2>
              </motion.div>

              {/* Yesterday's stats */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-baseline gap-2"
              >
                <span className="text-gray-400 text-sm">Yesterday:</span>
                <span className="text-2xl font-bold text-white">{yesterdayHours.toFixed(1)}h</span>
                {yesterdayHours > 0 && (
                  <span className="text-green-400 text-sm">✓ Logged</span>
                )}
              </motion.div>

              {/* Today's plan */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <p className="text-gray-400 text-sm font-medium">Your plan for today:</p>
                <div className="space-y-2 pl-4">
                  {tomorrowPlan ? (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                      <p className="text-white text-sm whitespace-pre-wrap">{tomorrowPlan}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-sm">Track your productive hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-sm">Maintain your streak</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        <span className="text-sm">Level up your XP</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 pt-4"
              >
                <Button
                  onClick={() => {
                    onStartTask()
                    onDismiss()
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/20 group"
                >
                  <span>Start First Task</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Maybe Later
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
