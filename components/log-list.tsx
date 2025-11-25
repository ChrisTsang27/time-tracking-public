'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2, CheckCircle2, Clock, AlertCircle, Edit2, MoreHorizontal } from 'lucide-react'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400 border-green-400/30 bg-green-400/10'
      case 'Blocked': return 'text-red-400 border-red-400/30 bg-red-400/10'
      default: return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white neon-text">Task Log</h2>
        <Badge variant="outline" className="border-white/20 text-gray-400">
          {logs.length} Entries
        </Badge>
      </div>

      <div className="glass-panel rounded-xl border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hours</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Time</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log.id}
                  onClick={() => {
                    setViewingLog(log)
                    setIsViewDialogOpen(true)
                  }}
                  className={cn(
                    "border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer",
                    index === 0 && "bg-blue-500/5"
                  )}
                >
                  <td className="p-3">
                    <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white line-clamp-1">{log.title || 'Untitled Task'}</span>
                        {index === 0 && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-[9px] px-1 py-0 h-4">
                            NEW
                          </Badge>
                        )}
                      </div>
                      {log.description && (
                        <p className="text-xs text-gray-400 line-clamp-1">{log.description}</p>
                      )}
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {log.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-white/10 text-gray-500">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {log.category && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-white/10 text-white">
                        {log.category}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-sm font-semibold text-white">{log.hours}h</span>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-blue-300 font-mono">
                        {log.start_time} - {log.end_time}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at || log.date), { addSuffix: true })}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border transition-all hover:brightness-110",
                            getStatusColor(log.progress)
                          )}
                        >
                          {getStatusIcon(log.progress)}
                          <span className="hidden sm:inline">{log.progress}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0f0c29]/95 border-white/10 text-white backdrop-blur-xl">
                        {(['In Progress', 'Completed', 'Blocked'] as const).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusUpdate(log, status)
                            }}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer hover:bg-white/10",
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
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingLog(log)
                          setIsEditDialogOpen(true)
                        }}
                        className="p-1.5 rounded hover:bg-blue-400/10 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(log.id)
                        }}
                        className="p-1.5 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
