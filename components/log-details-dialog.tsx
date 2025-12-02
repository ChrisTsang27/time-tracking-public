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
      <DialogContent className="glass-panel border-white/20 text-gray-900 dark:text-white sm:max-w-[500px] rounded-3xl shadow-2xl shadow-blue-500/10">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 leading-relaxed break-words text-left">
              {log.title || 'Untitled Task'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mb-1" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</span>
              <span className="font-mono font-medium text-sm text-gray-900 dark:text-white">{log.date}</span>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <Clock className="w-4 h-4 text-purple-500 dark:text-purple-400 mb-1" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</span>
              <span className="font-mono font-medium text-sm whitespace-nowrap text-gray-900 dark:text-white">
                {log.start_time && log.end_time ? `${log.start_time} - ${log.end_time}` : 'N/A'}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <Hourglass className="w-4 h-4 text-teal-500 dark:text-teal-400 mb-1" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</span>
              <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">{log.hours}<span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-0.5">h</span></span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Description</label>
            <div className="bg-gray-50 dark:bg-black/30 rounded-2xl p-4 border border-gray-100 dark:border-white/10 min-h-[100px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {log.description || 'No description provided.'}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Status</span>
            <Badge 
              variant="outline" 
              className={`rounded-full ${
                log.progress === 'Completed' ? 'text-green-700 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-400/30 dark:bg-green-400/10' : 
                log.progress === 'Blocked' ? 'text-red-700 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-400/30 dark:bg-red-400/10' : 
                'text-yellow-700 border-yellow-300 bg-yellow-100 dark:text-blue-400 dark:border-blue-400/30 dark:bg-blue-400/10'
              }`}
            >
              {log.progress}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
