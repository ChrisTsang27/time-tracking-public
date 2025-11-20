'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { TimeLog } from '@/types'

export default function ExportButton() {
  
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      toast.error('Failed to fetch data for export')
      return []
    }
    return data as TimeLog[]
  }

  const exportToExcel = async () => {
    const data = await fetchLogs()
    if (!data.length) return

    // Format data for Excel
    const formattedData = data.map(log => ({
      Date: log.date,
      Title: log.title || '',
      'Start Time': log.start_time || '',
      'End Time': log.end_time || '',
      Hours: log.hours,
      Status: log.progress,
      Description: log.description
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Time Logs")
    XLSX.writeFile(workbook, "time_logs.xlsx")
    toast.success('Exported to Excel')
  }

  const exportToTxt = async () => {
    const data = await fetchLogs()
    if (!data.length) return

    let content = "Time Logs Export\n================\n\n"
    data.forEach((log: TimeLog) => {
      content += `Date: ${log.date}\n`
      if (log.title) content += `Title: ${log.title}\n`
      if (log.start_time || log.end_time) content += `Time: ${log.start_time || '?'} - ${log.end_time || '?'}\n`
      content += `Hours: ${log.hours}\n`
      content += `Status: ${log.progress}\n`
      content += `Description: ${log.description}\n`
      content += `----------------\n`
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'time_logs.txt'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Exported to TXT')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/90 border-white/10 text-white">
        <DropdownMenuItem onClick={exportToExcel} className="hover:bg-white/10 cursor-pointer">
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToTxt} className="hover:bg-white/10 cursor-pointer">
          Export as Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
