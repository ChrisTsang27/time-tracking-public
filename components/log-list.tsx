'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { toast } from 'sonner'
import { Trash2, CheckCircle2, Clock, AlertCircle, Edit2, Briefcase, User, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import EditLogDialog from '@/components/edit-log-dialog'
import LogDetailsDialog from '@/components/log-details-dialog'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LogList({ refreshTrigger, onLogUpdated }: { refreshTrigger: number; onLogUpdated: () => void }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewingLog, setViewingLog] = useState<TimeLog | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetchLogs()
  }, [refreshTrigger])

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('date', { ascending: sortOrder === 'oldest' })
      .order('created_at', { ascending: sortOrder === 'oldest' })

    if (error) {
      toast.error('Failed to fetch logs')
    } else {
      setLogs(data as TimeLog[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!loading) {
      fetchLogs()
    }
  }, [sortOrder])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    const previousLogs = [...logs]
    setLogs(logs.filter(l => l.id !== id))

    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete task')
      setLogs(previousLogs)
    } else {
      toast.success('Task deleted')
      onLogUpdated()
    }
  }

  const handleStatusUpdate = async (log: TimeLog, newStatus: TimeLog['progress']) => {
    if (log.progress === newStatus) return

    setLogs(logs.map(l => l.id === log.id ? { ...l, progress: newStatus } : l))

    const { error } = await supabase
      .from('time_logs')
      .update({ progress: newStatus })
      .eq('id', log.id)

    if (error) {
      toast.error('Failed to update status')
      fetchLogs()
    } else {
      onLogUpdated()
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    if (timeString.toLowerCase().includes('undefined') || timeString.toLowerCase().includes('null')) return ''
    
    try {
      const [hours, minutes] = timeString.split(':')
      if (!hours || minutes === undefined) return timeString
      
      const hour = parseInt(hours)
      if (isNaN(hour)) return timeString
      
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'Blocked': return <AlertCircle className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Log</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-500 dark:text-gray-400">
              {logs.length}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setSortOrder('newest')}
              className={cn(
                "text-xs font-medium transition-all px-3 py-1.5 rounded-lg",
                sortOrder === 'newest' 
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              Latest
            </button>
            <button 
              onClick={() => setSortOrder('oldest')}
              className={cn(
                "text-xs font-medium transition-all px-3 py-1.5 rounded-lg",
                sortOrder === 'oldest' 
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              Oldest
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-[40px_1fr_120px_80px_140px_120px_80px] gap-4 px-4 py-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">
          <div>#</div>
          <div>TASK</div>
          <div>CATEGORY</div>
          <div>HOURS</div>
          <div>TIME</div>
          <div>STATUS</div>
          <div className="text-right">ACTIONS</div>
        </div>

        {/* Table Body */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => {
                  setViewingLog(log)
                  setIsViewDialogOpen(true)
                }}
                className="grid grid-cols-1 md:grid-cols-[40px_1fr_120px_80px_140px_120px_80px] gap-4 items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-white/10"
              >
                {/* # Column */}
                <div className="hidden md:block text-sm font-medium text-gray-400 dark:text-gray-600">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* TASK Column */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
                    log.category === 'Work' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                    log.category === 'Personal' ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" :
                    "bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
                  )}>
                    {log.category === 'Work' ? <Briefcase className="w-5 h-5" /> :
                     log.category === 'Personal' ? <User className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {log.title || 'Untitled Task'}
                    </h3>
                    {log.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {log.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:hidden">
                      {formatDistanceToNow(new Date(log.created_at || log.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* CATEGORY Column */}
                <div className="hidden md:block">
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-lg border",
                    log.category === 'Work' ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" :
                    log.category === 'Personal' ? "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400" :
                    "bg-gray-50 border-gray-100 text-gray-700 dark:bg-gray-500/10 dark:border-gray-500/20 dark:text-gray-400"
                  )}>
                    {log.category || 'None'}
                  </span>
                </div>

                {/* HOURS Column */}
                <div className="hidden md:block">
                  <p className="font-bold text-sm text-gray-900 dark:text-white font-mono">{log.hours}h</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{log.date}</p>
                </div>

                {/* TIME Column */}
                <div className="hidden md:block">
                  {log.start_time && log.end_time ? (
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md inline-block">
                      {formatTime(log.start_time)} - {formatTime(log.end_time)}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* STATUS Column */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5",
                        log.progress === 'Completed' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                        log.progress === 'Blocked' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                      )}>
                        {getStatusIcon(log.progress)}
                        {log.progress}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-panel border-gray-200 dark:border-white/10 shadow-xl rounded-xl p-1">
                      {(['In Progress', 'Completed', 'Blocked'] as const).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusUpdate(log, status)
                          }}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg px-2 py-1.5 outline-none",
                            log.progress === status && "bg-gray-100 dark:bg-white/5"
                          )}
                        >
                          <div className={cn("p-1 rounded-full", 
                            status === 'Completed' ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/10" :
                            status === 'Blocked' ? "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/10" :
                            "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/10"
                          )}>
                            {getStatusIcon(status)}
                          </div>
                          <span className="text-sm">{status}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* ACTIONS Column */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingLog(log)
                      setIsEditDialogOpen(true)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(log.id)
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile: Show hours and status at bottom */}
                <div className="flex md:hidden items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{log.hours}h</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      log.progress === 'Completed' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                      log.progress === 'Blocked' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                    )}>
                      {log.progress}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingLog(log)
                        setIsEditDialogOpen(true)
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(log.id)
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {!loading && logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tasks logged yet. Start by adding one!
          </div>
        )}
      </div>
      
      <EditLogDialog 
        log={editingLog} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        onLogUpdated={onLogUpdated} 
      />

      <LogDetailsDialog
        log={viewingLog}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </div>
  )
}
