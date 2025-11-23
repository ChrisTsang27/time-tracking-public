'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { calculateLevel, getLevelTitle } from '@/lib/gamification'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, Trophy, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UserStatusCard({ refreshTrigger }: { refreshTrigger: number }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [levelInfo, setLevelInfo] = useState({ level: 1, progress: 0, nextLevelXp: 500 })

  useEffect(() => {
    fetchProfile()
  }, [refreshTrigger])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setLevelInfo(calculateLevel(data.xp))
    }
  }

  if (!profile) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-panel border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 overflow-hidden relative">
        <CardContent className="p-3 flex items-center justify-between gap-4">
          
          {/* Level & Title - Compact */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-white neon-text">{getLevelTitle(levelInfo.level)}</h3>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">Lvl {levelInfo.level}</span>
              </div>
            </div>
          </div>

          {/* XP Progress - Slim */}
          <div className="flex-1 max-w-sm hidden md:flex items-center gap-3">
            <span className="text-[10px] text-gray-400 whitespace-nowrap">XP {Math.floor(profile.xp)} / {levelInfo.nextLevelXp}</span>
            <Progress value={levelInfo.progress} className="h-1.5 bg-black/40 w-full" indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500" />
          </div>

          {/* Streak - Compact */}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full shrink-0">
            <Flame className={`w-3.5 h-3.5 ${profile.current_streak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-xs font-bold text-orange-200">{profile.current_streak} Day Streak</span>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  )
}
