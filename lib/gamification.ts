import { Profile } from '@/types'

export const XP_PER_HOUR = 100
export const LEVEL_BASE_XP = 500
export const LEVEL_MULTIPLIER = 1.2

export function calculateLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  let level = 1
  let currentLevelXp = 0
  let nextLevelXp = LEVEL_BASE_XP

  while (xp >= nextLevelXp) {
    level++
    currentLevelXp = nextLevelXp
    nextLevelXp = Math.floor(nextLevelXp * LEVEL_MULTIPLIER)
  }

  const progress = Math.min(100, Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))

  return { level, progress, nextLevelXp }
}

export function calculateStreak(lastLogDate: string | null, newLogDate: string): number {
  if (!lastLogDate) return 1

  const last = new Date(lastLogDate)
  const current = new Date(newLogDate)
  
  // Reset time part for accurate day comparison
  last.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(current.getTime() - last.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 0 // Same day, no streak change (handled by caller to not increment)
  if (diffDays === 1) return 1 // Consecutive day, increment streak (handled by caller)
  return -1 // Streak broken (handled by caller to reset)
}

export function getLevelTitle(level: number): string {
  if (level < 5) return "Novice Chronomancer"
  if (level < 10) return "Time Weaver"
  if (level < 20) return "Temporal Adept"
  if (level < 30) return "Void Walker"
  if (level < 50) return "Time Lord"
  return "Eternal Guardian"
}
