'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function FocusTimer({ onSessionComplete }: { onSessionComplete?: (minutes: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsFinished(false)
    setTimeLeft(25 * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      setIsFinished(true)
      if (intervalRef.current) clearInterval(intervalRef.current)
      toast.success("Focus Session Complete! Take a break.")
      if (onSessionComplete) onSessionComplete(25)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, timeLeft, onSessionComplete])

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100

  return (
    <Card className="glass-panel border-blue-500/20 relative overflow-hidden">
      {/* Progress Bar Background */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-blue-500/50 transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Focus Timer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={cn(
            "text-5xl font-bold font-mono tabular-nums transition-colors duration-300",
            isActive ? "text-blue-400 neon-text" : "text-gray-500",
            isFinished && "text-green-400"
          )}>
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2 w-full">
            {!isFinished ? (
              <>
                <Button 
                  onClick={toggleTimer}
                  className={cn(
                    "flex-1 transition-all duration-300",
                    isActive 
                      ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20" 
                      : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                  )}
                >
                  {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isActive ? "Pause" : "Start Focus"}
                </Button>
                <Button 
                  onClick={resetTimer}
                  variant="outline"
                  className="border-white/10 text-gray-400 hover:bg-white/5"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                onClick={resetTimer}
                className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
