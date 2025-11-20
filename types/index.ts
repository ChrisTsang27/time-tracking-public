export type TimeLog = {
  id: string
  created_at: string
  date: string
  title?: string
  start_time?: string
  end_time?: string
  hours: number
  description: string
  progress: 'In Progress' | 'Completed' | 'Blocked'
  user_id: string
}

export type UserProfile = {
  id: string
  email: string
}
