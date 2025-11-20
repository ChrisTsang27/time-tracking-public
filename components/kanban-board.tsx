'use client'

import { useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'

import { Trash2 } from 'lucide-react'

// ... imports

// Sortable Item Component
function SortableItem({ log, onDelete }: { log: TimeLog, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: log.id, data: { log } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 cursor-grab active:cursor-grabbing group relative">
      <Card className="bg-black/40 border-white/10 hover:border-white/30 transition-colors">
        <CardContent className="p-4">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button 
               onClick={(e) => {
                 e.stopPropagation() // Prevent drag start
                 onDelete(log.id)
               }}
               className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
             >
               <Trash2 className="h-3 w-3" />
             </button>
          </div>
          <div className="flex justify-between items-start mb-2 pr-6">
            <div>
              <h4 className="text-sm font-medium text-white">{log.title || 'Untitled Task'}</h4>
              <span className="text-xs text-gray-400">{log.date}</span>
            </div>
            <Badge variant="outline" className="border-white/20 text-white">
              {log.hours}h
            </Badge>
          </div>
          {(log.start_time || log.end_time) && (
            <div className="text-xs text-blue-300 mb-2">
              {log.start_time} - {log.end_time}
            </div>
          )}
          <p className="text-sm text-gray-200 line-clamp-2">{log.description}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Column Component
function KanbanColumn({ id, title, logs, onDelete }: { id: string, title: string, logs: TimeLog[], onDelete: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id })

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px]">
      <div className="bg-black/20 rounded-lg p-4 border border-white/5 h-full">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center justify-between">
          {title}
          <Badge className="bg-white/10 text-white hover:bg-white/20">{logs.length}</Badge>
        </h3>
        <SortableContext items={logs.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[100px]">
            {logs.map(log => (
              <SortableItem key={log.id} log={log} onDelete={onDelete} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard({ refreshTrigger }: { refreshTrigger: number }) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor)
  )

  useEffect(() => {
    fetchLogs()
  }, [refreshTrigger])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch logs')
    } else {
      setLogs(data as TimeLog[])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    // Optimistic update
    const previousLogs = [...logs]
    setLogs(logs.filter(l => l.id !== id))

    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete task')
      setLogs(previousLogs) // Revert
    } else {
      toast.success('Task deleted')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveLog(active.data.current?.log as TimeLog)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let newStatus = ''
    if (['In Progress', 'Completed', 'Blocked'].includes(overId)) {
      newStatus = overId
    } else {
      // Dropped on an item, find that item's status
      const overLog = logs.find(l => l.id === overId)
      if (overLog) {
        newStatus = overLog.progress
      }
    }

    if (newStatus && activeLog && activeLog.progress !== newStatus) {
      // Optimistic update
      const updatedStatus = newStatus as 'In Progress' | 'Completed' | 'Blocked'
      setLogs(logs.map(l => l.id === activeId ? { ...l, progress: updatedStatus } : l))
      
      // DB Update
      const { error } = await supabase
        .from('time_logs')
        .update({ progress: newStatus })
        .eq('id', activeId)

      if (error) {
        toast.error('Failed to update status')
        fetchLogs() // Revert
      }
    }
    
    setActiveId(null)
    setActiveLog(null)
  }

  const columns = ['In Progress', 'Completed', 'Blocked']

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-6 overflow-x-auto pb-4 min-h-[500px]"
      >
        {columns.map((status, index) => (
          <KanbanColumn 
            key={status} 
            id={status} 
            title={status} 
            logs={logs.filter(l => l.progress === status)} 
            onDelete={handleDelete}
          />
        ))}
      </motion.div>
      <DragOverlay>
        {activeLog ? (
           <Card className="bg-zinc-900/90 backdrop-blur-xl border-blue-500/30 w-[300px] rotate-3 cursor-grabbing shadow-2xl shadow-blue-500/20">
             <CardContent className="p-4">
               <div className="flex justify-between items-start mb-2">
                 <div>
                    <h4 className="text-sm font-medium text-white">{activeLog.title || 'Untitled Task'}</h4>
                    <span className="text-xs font-mono text-blue-400">{activeLog.date}</span>
                 </div>
                 <Badge variant="outline" className="border-blue-500/30 text-blue-200 bg-blue-500/10">
                   {activeLog.hours}h
                 </Badge>
               </div>
               <p className="text-sm text-gray-200">{activeLog.description}</p>
             </CardContent>
           </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
