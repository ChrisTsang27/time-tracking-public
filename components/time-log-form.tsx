'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { motion } from 'framer-motion'

export default function TimeLogForm({ onLogAdded }: { onLogAdded: () => void }) {
  // ... existing state ...
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in to add a log')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('time_logs').insert({
      title,
      hours: parseFloat(hours),
      description,
      date,
      start_time: startTime,
      end_time: endTime,
      progress: 'In Progress',
      user_id: user.id
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Log added successfully')
      setTitle('')
      setHours('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      onLogAdded()
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-panel border-white/10 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
        <CardHeader>
          <CardTitle className="text-lg font-semibold neon-text flex items-center gap-2">
            <span className="text-blue-400">➜</span> New Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-blue-50 hover:text-blue-900 transition-all duration-300 font-medium">
              <Plus className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Log Time'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
