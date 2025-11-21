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
      <DialogContent className="bg-[#0f0c29]/95 border-white/10 text-white backdrop-blur-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold neon-text">Edit Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Title</label>
            <Input
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/30 border-white/10 text-white focus:border-blue-500/50 transition-colors"
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
                className="bg-black/30 border-white/10 text-white focus:border-blue-500/50 transition-colors"
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
                className="bg-black/30 border-white/10 text-white focus:border-blue-500/50 transition-colors"
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
                className="bg-black/30 border-white/10 text-white focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">End Time</label>
              <Input
                placeholder="e.g. 11pm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-black/30 border-white/10 text-white focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Description</label>
            <Textarea
              placeholder="Task details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/30 border-white/10 text-white min-h-[100px] focus:border-blue-500/50 transition-colors resize-none"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 font-medium">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
