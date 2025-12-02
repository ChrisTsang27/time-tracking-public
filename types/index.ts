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
  category?: string
  tags?: string[]
}

export interface Profile {
  id: string
  email: string
  xp: number
  level: number
  current_streak: number
  last_log_date: string | null
  power_ups_count?: number
}

//  Invoice Types
export interface InvoiceSettings {
  id: string
  user_id: string
  from_name: string
  from_abn?: string
  from_email?: string
  from_phone?: string
  bank_name?: string
  bank_bsb?: string
  bank_account?: string
  bank_account_name?: string
  default_hourly_rate?: number
  default_currency: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  invoice_date: string
  client_name: string
  client_reference?: string
  from_name?: string
  from_abn?: string
  from_email?: string
  from_phone?: string
  bank_name?: string
  bank_bsb?: string
  bank_account?: string
  bank_account_name?: string
  bank_reference?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  currency: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  time_log_id?: string
  line_order: number
  created_at: string
}
