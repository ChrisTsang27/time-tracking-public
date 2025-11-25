'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Plus } from 'lucide-react'
import ExportButton from '@/components/export-button'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateLevel } from '@/lib/gamification'
import { Flame, Trophy } from 'lucide-react'
import { Sunrise, Sunset } from 'lucide-react'

interface AppHeaderProps {
  userEmail: string | null
  onLogout: () => void
  onAddRecord: () => void
  refreshTrigger: number
  onShowKickoff: () => void
  onShowReflection: () => void
}

export default function AppHeader({ userEmail, onLogout, onAddRecord, refreshTrigger, onShowKickoff, onShowReflection }: AppHeaderProps) {
  const [levelInfo, setLevelInfo] = useState({ level: 1, progress: 0, nextLevelXp: 500 })
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    fetchUserStats()
  }, [refreshTrigger])

  const fetchUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('xp, current_streak')
      .eq('id', user.id)
      .single()

    if (data) {
      setLevelInfo(calculateLevel(data.xp))
      setStreak(data.current_streak || 0)
    }
  }
  const getInitials = (email: string | null) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <header className="h-14 sm:h-16 glass-panel border-b border-white/10 flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <h1 className="text-base sm:text-xl font-bold neon-text bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          CHRONO<span className="text-white">SYNC</span>
        </h1>
        {/* Project selector - hidden for now
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-gray-500">PROJECT:</span>
          <span className="text-sm text-white font-medium">Personal</span>
        </div>
        */}
        
        {/* Time Weaver - Compact Header Version */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">LV</span>
              <span className="text-sm font-bold text-white">{levelInfo.level}</span>
            </div>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-sm font-semibold text-white">{streak}</span>
            <span className="text-xs text-gray-400">day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          onClick={onAddRecord}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Record</span>
        </Button>
        
        {/* Dialog Triggers */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowKickoff}
            className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
            title="Daily Kickoff"
          >
            <Sunrise className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowReflection}
            className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
            title="End of Day Review"
          >
            <Sunset className="w-4 h-4" />
          </Button>
        </div>

        <div className="hidden md:block" data-export-trigger onClick={() => document.getElementById('export-btn')?.click()}>
          <ExportButton />
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
          <Avatar className="h-8 w-8 border-2 border-blue-500/30 cursor-pointer hover:border-blue-500/60 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
              {getInitials(userEmail)}
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onLogout} 
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
