'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, CheckCircle2, Clock, AlertCircle, ArrowRight, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import EditLogDialog from '@/components/edit-log-dialog'
import LogDetailsDialog from '@/components/log-details-dialog'
import { formatDistanceToNow } from 'date-fns'
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

  useEffect(() => {
    fetchLogs()
  }, [refreshTrigger])

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch logs')
    } else {
      setLogs(data as TimeLog[])
    }
    setLoading(false)
  }

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

    // Optimistic update
    setLogs(logs.map(l => l.id === log.id ? { ...l, progress: newStatus } : l))

    const { error } = await supabase
      .from('time_logs')
      .update({ progress: newStatus })
      .eq('id', log.id)

    if (error) {
      toast.error('Failed to update status')
      fetchLogs() // Revert
    } else {
      onLogUpdated()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400 border-green-400/30 bg-green-400/10'
      case 'Blocked': return 'text-red-400 border-red-400/30 bg-red-400/10'
      default: return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />
      case 'Blocked': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white neon-text">Task Log</h2>
        <Badge variant="outline" className="border-white/20 text-gray-400">
          {logs.length} Entries
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full"
            >
              <Card 
                onClick={() => {
                  setViewingLog(log)
                  setIsViewDialogOpen(true)
                }}
                className={cn(
                "glass-panel transition-all duration-300 group relative overflow-hidden h-full cursor-pointer hover:bg-white/5",
                index === 0 ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : "border-white/5 hover:border-white/20"
              )}>
                {/* Sequence Number Watermark */}
                <div className="absolute -right-4 -top-4 text-[60px] font-bold text-white/[0.02] pointer-events-none select-none">
                  #{index + 1}
                </div>

                <CardContent className="p-4 flex flex-col justify-between h-full gap-4 relative z-10">
                  
                  {/* Left Section: Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 mr-1">#{index + 1}</span>
                      <h3 className="text-lg font-medium text-white line-clamp-2 leading-tight" title={log.title}>{log.title || 'Untitled Task'}</h3>
                      {index === 0 && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/50 text-[10px] px-1.5 py-0.5 rounded animate-pulse font-bold">
                          NEW
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                         <span className="text-[10px] text-gray-500 font-mono hidden md:inline-block">
                          {log.date}
                        </span>
                        <Badge variant="outline" className="border-white/10 text-blue-300 text-xs font-mono bg-blue-500/5">
                          {formatDistanceToNow(new Date(log.created_at || log.date), { addSuffix: true })}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1">{log.description}</p>
                    {(log.start_time || log.end_time) && (
                      <div className="text-xs text-blue-300/80 font-mono flex items-center gap-1">
                        {log.start_time} <ArrowRight className="w-3 h-3" /> {log.end_time}
                        <span className="text-gray-500 mx-2">|</span>
                        <span className="text-white">{log.hours}h</span>
                      </div>
                    )}
                  </div>

                  {/* Actions - Bottom Row */}
                  <div className="flex items-center justify-between w-full pt-4 border-t border-white/5 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingLog(log)
                        setIsEditDialogOpen(true)
                      }}
                      className="p-2 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:brightness-110 active:scale-95 outline-none focus:ring-2 focus:ring-white/20",
                            getStatusColor(log.progress)
                          )}
                        >
                          {getStatusIcon(log.progress)}
                          {log.progress}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0f0c29]/95 border-white/10 text-white backdrop-blur-xl shadow-2xl shadow-black/50">
                        {(['In Progress', 'Completed', 'Blocked'] as const).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusUpdate(log, status)
                            }}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10 my-1 transition-colors duration-200",
                              log.progress === status && "bg-white/5"
                            )}
                          >
                            <div className={cn("p-1 rounded-full", 
                              status === 'Completed' ? "text-green-400 bg-green-400/10" :
                              status === 'Blocked' ? "text-red-400 bg-red-400/10" :
                              "text-blue-400 bg-blue-400/10"
                            )}>
                              {getStatusIcon(status)}
                            </div>
                            <span>{status}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(log.id)
                      }}
                      className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
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
