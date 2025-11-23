'use client'

import { TimeLog } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Hourglass } from 'lucide-react'

interface LogDetailsDialogProps {
  log: TimeLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LogDetailsDialog({ log, open, onOpenChange }: LogDetailsDialogProps) {
  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0c29]/95 border-white/10 text-white backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="text-xl font-bold neon-text leading-relaxed break-words text-left">
              {log.title || 'Untitled Task'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center text-center">
              <Calendar className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Date</span>
              <span className="font-mono font-medium text-sm">{log.date}</span>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center text-center">
              <Clock className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Time</span>
              <span className="font-mono font-medium text-sm whitespace-nowrap">
                {log.start_time && log.end_time ? `${log.start_time} - ${log.end_time}` : 'N/A'}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center text-center">
              <Hourglass className="w-4 h-4 text-pink-400 mb-1" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Duration</span>
              <span className="font-mono font-bold text-lg text-white">{log.hours}<span className="text-sm font-normal text-gray-400 ml-0.5">h</span></span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Description</label>
            <div className="bg-black/30 rounded-lg p-4 border border-white/10 min-h-[100px] text-gray-300 leading-relaxed whitespace-pre-wrap">
              {log.description || 'No description provided.'}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Status</span>
            <Badge 
              variant="outline" 
              className={`
                ${log.progress === 'Completed' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 
                  log.progress === 'Blocked' ? 'text-red-400 border-red-400/30 bg-red-400/10' : 
                  'text-blue-400 border-blue-400/30 bg-blue-400/10'}
              `}
            >
              {log.progress}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
