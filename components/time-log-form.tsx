'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Plus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { calculateStreak, XP_PER_HOUR } from '@/lib/gamification'

export default function TimeLogForm({ onLogAdded, defaultDate }: { onLogAdded: () => void; defaultDate?: string }) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [category, setCategory] = useState('Work')
  const [tags, setTags] = useState('')
  const [date, setDate] = useState(() => {
    if (defaultDate) return defaultDate
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
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

    // Calculate XP (100 XP per hour)
    const xpEarned = Math.round(parseFloat(hours) * 100)
    
    // Process tags
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)

    const { error } = await supabase.from('time_logs').insert({
      title,
      hours: parseFloat(hours),
      description,
      date,
      start_time: startTime,
      end_time: endTime,
      progress: 'In Progress',
      user_id: user.id,
      category,
      tags: tagList
    })

    if (error) {
      toast.error(error.message)
    } else {
      // --- GAMIFICATION LOGIC START ---
      try {
        // 1. Get current profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        let newXP = (profile?.xp || 0) + xpEarned
        let newStreak = profile?.current_streak || 0
        
        // Calculate Streak
        const streakChange = calculateStreak(profile?.last_log_date || null, date)
        if (streakChange === 1) newStreak += 1
        else if (streakChange === -1) newStreak = 1 // Reset to 1 if broken
        else if (newStreak === 0) newStreak = 1 // First ever log

        // 2. Update or Insert Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            xp: newXP,
            current_streak: newStreak,
            last_log_date: date
          })

        if (profileError) console.error('Error updating profile:', profileError)
        else {
          if (streakChange === 1) toast.success('🔥 Streak Increased!')
          toast.success(`+${xpEarned} XP Gained!`)
        }
      } catch (err) {
        console.error('Gamification error:', err)
      }
      // --- GAMIFICATION LOGIC END ---

      toast.success('Log added successfully')
      setTitle('')
      setHours('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setTags('')
      // Keep date and category as is for convenience
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
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Title</label>
              <Input
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-9 glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 text-sm rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Code">Code</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Tags</label>
                <Input
                  placeholder="react, db..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0.0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Start</label>
                <Input
                  placeholder="9:00 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">End</label>
                <Input
                  placeholder="5:00 PM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500/50 transition-colors h-9 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Description</label>
              <Textarea
                placeholder="Task details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-input bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[80px] focus:border-blue-500/50 transition-colors resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 font-medium h-9 text-sm rounded-lg">
              <Plus className="mr-2 h-3 w-3" />
              {loading ? 'Processing...' : 'Log Time'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
