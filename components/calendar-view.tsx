'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import TimeLogDialog from '@/components/time-log-dialog'
import EditLogDialog from '@/components/edit-log-dialog'

export default function CalendarView({ refreshTrigger }: { refreshTrigger: number }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Edit Dialog State
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [currentDate, refreshTrigger])

  const fetchLogs = async () => {
    setLoading(true)
    const start = startOfMonth(currentDate).toISOString()
    const end = endOfMonth(currentDate).toISOString()

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .gte('date', start)
      .lte('date', end)

    if (!error && data) {
      setLogs(data as TimeLog[])
    }
    setLoading(false)
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const getDayLogs = (date: Date) => {
    return logs.filter(log => isSameDay(new Date(log.date), date))
  }

  const getDayHours = (date: Date) => {
    const dayLogs = getDayLogs(date)
    return dayLogs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const handleLogClick = (e: React.MouseEvent, log: TimeLog) => {
    e.stopPropagation()
    setEditingLog(log)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white neon-text">Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 border-white/10 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center font-medium text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 border-white/10 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-2 border-white/10 hover:bg-white/10 text-xs">
            Today
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-xl border-white/10 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {calendarDays.map((day, dayIdx) => {
            const dayLogs = getDayLogs(day)
            const totalHours = getDayHours(day)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "border-b border-r border-white/10 p-2 transition-colors hover:bg-white/5 cursor-pointer relative group flex flex-col",
                  !isCurrentMonth && "bg-black/20 opacity-50",
                  isTodayDate && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isTodayDate ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {totalHours > 0 && (
                      <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        {totalHours}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar relative z-10">
                  {dayLogs.map((log, i) => (
                    <div 
                      key={log.id} 
                      onClick={(e) => handleLogClick(e, log)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 truncate hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer hover:border-blue-500/30"
                      title={`${log.title} (${log.hours}h)`}
                    >
                      {log.title || 'Untitled'}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TimeLogDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onLogAdded={() => {
          fetchLogs()
        }}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      <EditLogDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        log={editingLog}
        onLogUpdated={() => {
          fetchLogs()
        }}
      />
    </div>
  )
}
