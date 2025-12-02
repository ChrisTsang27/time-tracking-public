'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeLog } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface EditLogDialogProps {
  log: TimeLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogUpdated: () => void
}

export default function EditLogDialog({ log, open, onOpenChange, onLogUpdated }: EditLogDialogProps) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (log) {
      setTitle(log.title || '')
      setHours(log.hours?.toString() || '')
      setDescription(log.description || '')
      setStartTime(log.start_time || '')
      setEndTime(log.end_time || '')
      setDate(log.date || '')
    }
  }, [log])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!log) return

    setLoading(true)

    const { error } = await supabase
      .from('time_logs')
      .update({
        title,
        hours: parseFloat(hours),
        description,
        date,
        start_time: startTime,
        end_time: endTime,
      })
      .eq('id', log.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Log updated successfully')
      onLogUpdated()
      onOpenChange(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-panel border-white/20 text-gray-900 dark:text-white rounded-3xl shadow-2xl shadow-blue-500/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">Edit Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Title</label>
            <Input
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Hours</label>
              <Input
                type="number"
                step="0.5"
                placeholder="0.0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors rounded-xl"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Start Time</label>
              <Input
                placeholder="e.g. 9pm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">End Time</label>
              <Input
                placeholder="e.g. 11pm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Description</label>
            <Textarea
              placeholder="Task details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[100px] focus:border-teal-500 dark:focus:border-blue-500/50 transition-colors resize-none rounded-xl"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 font-medium rounded-xl">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
