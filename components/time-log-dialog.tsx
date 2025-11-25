'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TimeLogForm from '@/components/time-log-form'

interface TimeLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogAdded: () => void
}

export default function TimeLogDialog({ open, onOpenChange, onLogAdded }: TimeLogDialogProps) {
  const handleLogAdded = () => {
    onLogAdded()
    onOpenChange(false) // Close dialog after successful log
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold neon-text bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Add Time Record
          </DialogTitle>
        </DialogHeader>
        <TimeLogForm onLogAdded={handleLogAdded} />
      </DialogContent>
    </Dialog>
  )
}
