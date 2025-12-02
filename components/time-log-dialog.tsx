'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TimeLogForm from '@/components/time-log-form'

interface TimeLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogAdded: () => void
  defaultDate?: string
}

export default function TimeLogDialog({ open, onOpenChange, onLogAdded, defaultDate }: TimeLogDialogProps) {
  const handleLogAdded = () => {
    onLogAdded()
    onOpenChange(false) // Close dialog after successful log
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border-white/20 p-6 shadow-2xl shadow-blue-500/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Add Time Record
          </DialogTitle>
        </DialogHeader>
        <TimeLogForm onLogAdded={handleLogAdded} defaultDate={defaultDate} />
      </DialogContent>
    </Dialog>
  )
}
