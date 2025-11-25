'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/app-sidebar'
import AppHeader from '@/components/app-header'
import TimeLogDialog from '@/components/time-log-dialog'
import LogList from '@/components/log-list'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import { CommandPalette } from '@/components/command-palette'
import DailyKickoff from '@/components/daily-kickoff'
import EndOfDayReflection from '@/components/end-of-day-reflection'
import QuickStats from '@/components/quick-stats'
import ExportButton from '@/components/export-button'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [showKickoff, setShowKickoff] = useState(false)
  const [showReflection, setShowReflection] = useState(false)

  useEffect(() => {
    checkUser()
    checkDailyKickoff()
    checkEveningReflection()
  }, [])

  const checkDailyKickoff = () => {
    const hour = new Date().getHours()
    const today = new Date().toISOString().split('T')[0]
    const lastShown = localStorage.getItem('lastKickoffDate')
    
    // Only show in the morning (before 6 PM) and once per day
    if (hour < 18 && lastShown !== today) {
      setTimeout(() => setShowKickoff(true), 500)
    }
  }

  const handleDismissKickoff = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('lastKickoffDate', today)
    setShowKickoff(false)
  }

  const checkEveningReflection = () => {
    const hour = new Date().getHours()
    const today = new Date().toISOString().split('T')[0]
    const lastShown = localStorage.getItem('lastReflectionDate')
    const kickoffShown = localStorage.getItem('lastKickoffDate')
    
    // Show after 6 PM, only once per day
    // Allow if kickoff was shown today OR if it's evening (too late for kickoff)
    if (hour >= 18 && lastShown !== today) {
      // If kickoff was already shown today, or it's past kickoff time anyway
      const canShow = kickoffShown === today || hour >= 18
      if (canShow) {
        setTimeout(() => setShowReflection(true), 1000)
      }
    }
  }

  const handleDismissReflection = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('lastReflectionDate', today)
    setShowReflection(false)
  }

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUserEmail(session.user.email || 'User')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogTime = () => {
    setLogDialogOpen(true)
  }

  const handleExport = () => {
    const exportBtn = document.querySelector('button[data-export-trigger]') as HTMLButtonElement
    if (exportBtn) {
      exportBtn.click()
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading interface...</div>
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {showKickoff && userEmail && (
        <DailyKickoff 
          userName={userEmail} 
          onStartTask={handleLogTime}
          onDismiss={handleDismissKickoff}
        />
      )}
      {showReflection && (
        <EndOfDayReflection onDismiss={handleDismissReflection} />
      )}
      <CommandPalette 
        onLogTime={handleLogTime} 
        onExport={handleExport}
        onShowKickoff={() => setShowKickoff(true)}
        onShowReflection={() => setShowReflection(true)}
      />
      <TimeLogDialog 
        open={logDialogOpen} 
        onOpenChange={setLogDialogOpen} 
        onLogAdded={refreshData} 
      />
      <div className="gradient-bg" />
      
      <AppHeader 
        userEmail={userEmail} 
        onLogout={handleLogout} 
        onAddRecord={() => setLogDialogOpen(true)}
        refreshTrigger={refreshTrigger}
        onShowKickoff={() => setShowKickoff(true)}
        onShowReflection={() => setShowReflection(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeView === 'dashboard' && (
            <>
              {/* KPI Summary */}
              <QuickStats refreshTrigger={refreshTrigger} />

              {/* Analytics Charts */}
              <AnalyticsDashboard refreshTrigger={refreshTrigger} />

              {/* Recent Sessions */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
                <LogList refreshTrigger={refreshTrigger} onLogUpdated={refreshData} />
              </div>
            </>
          )}

          {activeView === 'records' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">All Records</h2>
              <LogList refreshTrigger={refreshTrigger} onLogUpdated={refreshData} />
            </>
          )}

          {activeView === 'projects' && (
            <div className="glass-panel p-8 rounded-xl border-white/10 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Projects</h2>
              <p className="text-gray-400">Project management coming soon...</p>
            </div>
          )}

          {activeView === 'export' && (
            <div className="glass-panel p-8 rounded-xl border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Export Data</h2>
              <p className="text-gray-400 mb-6">Download your time logs in various formats</p>
              <ExportButton />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
