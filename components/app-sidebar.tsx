'use client'

import { useState } from 'react'
import { Home, FileText, FolderKanban, Download, ChevronRight, Calendar, Settings, LogOut, PieChart, CreditCard, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export default function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'export', label: 'Export', icon: Download },
  ]

  const accountItems = [
    { id: 'settings', label: 'Setting', icon: Settings },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ]

  return (
    <aside className="w-64 h-full bg-white dark:bg-background border-r border-gray-200 dark:border-white/10 flex flex-col transition-colors duration-300">
      <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-8">
        {/* Main Menu */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</h3>
          <nav className="space-y-1">
            {mainMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 dark:bg-white dark:text-gray-900" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-[1.15rem] h-[1.15rem] transition-colors",
                    isActive ? "text-white dark:text-gray-900" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )} />
                  <span className="flex-1 text-left text-[0.95rem] font-medium tracking-wide">{item.label}</span>
                  {item.id === 'records' && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                      isActive ? "bg-white/20 text-white dark:bg-gray-900/10 dark:text-gray-900" : "bg-teal-500 text-white"
                    )}>26</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Account Management */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Account Management</h3>
          <nav className="space-y-1">
            {accountItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === 'logout' ? onViewChange('logout') : onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
              >
                <IconWrapper icon={item.icon} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}

function IconWrapper({ icon: Icon }: { icon: any }) {
  return <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
}
