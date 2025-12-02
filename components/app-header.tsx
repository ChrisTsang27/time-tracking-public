'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Plus, Sun, Moon, FileText } from 'lucide-react'
import ExportButton from '@/components/export-button'
import InvoiceDialog from '@/components/invoice-dialog'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateLevel } from '@/lib/gamification'
import { Flame, Trophy, Sunrise, Sunset } from 'lucide-react'
import { useTheme } from 'next-themes'

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
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const { theme, setTheme } = useTheme()

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
    <header className="h-14 sm:h-16 glass-panel border-b border-gray-200 dark:border-white/10 shadow-sm shadow-gray-200/50 dark:shadow-none flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
          CHRONO<span className="text-gray-900 dark:text-white">SYNC</span>
        </h1>
        
        {/* Time Weaver - Compact Header Version */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">LV</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{levelInfo.level}</span>
            </div>
          </div>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{streak}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-transparent"
          title="Toggle theme"
        >
          <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400 hidden dark:block" />
          <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400 block dark:hidden" />
        </button>

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

        <Button
          onClick={() => setInvoiceOpen(true)}
          size="sm"
          variant="outline"
          className="hidden md:flex items-center gap-1 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:hover:bg-purple-500/10"
        >
          <FileText className="w-4 h-4" />
          <span>Invoice</span>
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400">{userEmail}</p>
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
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <InvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />
    </header>
  )
}
