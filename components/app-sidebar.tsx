'use client'

import { useState } from 'react'
import { Home, FileText, FolderKanban, Download, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export default function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'records', label: 'Records', icon: FileText },
    // { id: 'projects', label: 'Projects', icon: FolderKanban }, // Hidden for now
    { id: 'export', label: 'Export', icon: Download },
  ]

  return (
    <aside className="w-64 h-full glass-panel border-r border-white/10 p-4 flex flex-col">
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white" 
                  : "hover:bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-400" : "text-gray-500 group-hover:text-blue-400"
              )} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              )}
            </button>
          )
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-mono">CHRONOSYNC v2.0</p>
          <p className="mt-1 opacity-60">TACTICAL SUITE</p>
        </div>
      </div>
    </aside>
  )
}
