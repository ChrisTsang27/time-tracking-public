'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LogList({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)

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
    }
  }

  const handleStatusChange = async (log: TimeLog) => {
    const statusOrder: TimeLog['progress'][] = ['In Progress', 'Completed', 'Blocked']
    const currentIndex = statusOrder.indexOf(log.progress)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    // Optimistic update
    setLogs(logs.map(l => l.id === log.id ? { ...l, progress: nextStatus } : l))

    const { error } = await supabase
      .from('time_logs')
      .update({ progress: nextStatus })
      .eq('id', log.id)

    if (error) {
      toast.error('Failed to update status')
      fetchLogs() // Revert
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

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="glass-panel border-white/5 hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  
                  {/* Left Section: Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-white truncate">{log.title || 'Untitled Task'}</h3>
                      <Badge variant="outline" className="border-white/10 text-gray-400 text-xs font-mono">
                        {log.date}
                      </Badge>
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

                  {/* Right Section: Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleStatusChange(log)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:brightness-110 active:scale-95",
                        getStatusColor(log.progress)
                      )}
                    >
                      {getStatusIcon(log.progress)}
                      {log.progress}
                    </button>

                    <div className="w-px h-8 bg-white/10 hidden md:block" />

                    <button
                      onClick={() => handleDelete(log.id)}
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
    </div>
  )
}
