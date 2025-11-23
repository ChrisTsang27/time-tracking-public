'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import TimeLogForm from '@/components/time-log-form'
import LogList from '@/components/log-list'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import UserStatusCard from '@/components/user-status-card'
import ExportButton from '@/components/export-button'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading interface...</div>
  }

  return (
    <div className="min-h-screen p-4 space-y-4 relative">
      <div className="gradient-bg" />
      {/* Header */}
      <header className="flex justify-between items-center glass-panel p-4 rounded-xl border-blue-500/20">
        <div>
          <h1 className="text-2xl font-bold neon-text bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            CHRONO<span className="text-white">SYNC</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 tracking-wider">PERSONAL TIME TRACKING TERMINAL</p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-xs text-gray-400 hidden md:block">Welcome back, <span className="text-blue-400">{userEmail}</span></p>
          <div className="flex gap-3">
            <ExportButton />
            <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* RPG Status Card */}
      <UserStatusCard refreshTrigger={refreshTrigger} />

      {/* Analytics Section */}
      <AnalyticsDashboard refreshTrigger={refreshTrigger} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Input Form */}
        <div className="lg:col-span-1">
          <TimeLogForm onLogAdded={refreshData} />
        </div>

        {/* Right Area: Log List */}
        <div className="lg:col-span-3">
          <LogList refreshTrigger={refreshTrigger} onLogUpdated={refreshData} />
        </div>
      </div>
    </div>
  )
}
