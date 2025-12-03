'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { TimeLog, Invoice, InvoiceItem, InvoiceSettings } from '@/types'
import { downloadInvoicePDF } from '@/lib/invoice-generator'
import { toast } from 'sonner'
import { FileText, Download } from 'lucide-react'
import InvoicePreview from './invoice-preview'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
  const [customItems, setCustomItems] = useState<Array<{ id: string; description: string; hours: number }>>([
    { id: '1', description: '', hours: 0 }
  ])
  
  // Form state
  const [formData, setFormData] = useState({
    // Invoice details
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    clientName: '',
    clientReference: '',
    
    // From (business details)
    fromName: '',
    fromAbn: '',
    fromEmail: '',
    fromPhone: '',
    
    // Bank details
    bankName: '',
    bankBsb: '',
    bankAccount: '',
    bankAccountName: '',
    bankReference: '',
    
    // Billing
    hourlyRate: 0,
    currency: 'AUD',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      loadSettings()
      loadTimeLogs()
      generateInvoiceNumber()
    } else {
      // Reset on close
      setSelectedLogIds(new Set())
    }
  }, [open])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      // Pre-fill form with saved settings
      setFormData(prev => ({
        ...prev,
        fromName: data.from_name || '',
        fromAbn: data.from_abn || '',
        fromEmail: data.from_email || '',
        fromPhone: data.from_phone || '',
        bankName: data.bank_name || '',
        bankBsb: data.bank_bsb || '',
        bankAccount: data.bank_account || '',
        bankAccountName: data.bank_account_name || '',
        hourlyRate: data.default_hourly_rate || 0,
        currency: data.default_currency || 'AUD',
      }))
    }
  }

  const loadTimeLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load last 30 days of logs
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data } = await supabase
      .from('time_logs')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (data) {
      setTimeLogs(data as TimeLog[])
    }
  }

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    setFormData(prev => ({ ...prev, invoiceNumber: `INV-${timestamp}` }))
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleLog = (logId: string) => {
    const newSelected = new Set(selectedLogIds)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogIds(newSelected)
  }

  const calculateTotal = () => {
    const selectedLogs = timeLogs.filter(log => selectedLogIds.has(log.id))
    const timeLogHours = selectedLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0)
    const customHours = customItems.reduce((sum, item) => sum + Number(item.hours || 0), 0)
    const totalHours = timeLogHours + customHours
    return totalHours * formData.hourlyRate
  }

  const addCustomItem = () => {
    setCustomItems([...customItems, { id: Date.now().toString(), description: '', hours: 0 }])
  }

  const removeCustomItem = (id: string) => {
    setCustomItems(customItems.filter(item => item.id !== id))
  }

  const updateCustomItem = (id: string, field: 'description' | 'hours', value: string | number) => {
    setCustomItems(customItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Real-time preview data using useMemo for performance
  const previewInvoice = useMemo((): Partial<Invoice> => {
    const total = calculateTotal()
    return {
      invoice_number: formData.invoiceNumber,
      invoice_date: formData.invoiceDate,
      client_name: formData.clientName,
      client_reference: formData.clientReference || undefined,
      from_name: formData.fromName,
      from_abn: formData.fromAbn || undefined,
      from_email: formData.fromEmail || undefined,
      from_phone: formData.fromPhone || undefined,
      bank_name: formData.bankName || undefined,
      bank_bsb: formData.bankBsb || undefined,
      bank_account: formData.bankAccount || undefined,
      bank_account_name: formData.bankAccountName || undefined,
      bank_reference: formData.bankReference || undefined,
      subtotal: total,
      tax_amount: 0,
      total_amount: total,
      currency: formData.currency,
      notes: formData.notes || undefined,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedLogIds, timeLogs])

  const previewItems = useMemo(() => {
    const selectedLogs = timeLogs.filter(log => selectedLogIds.has(log.id))
    const timeLogItems = selectedLogs.map(log => ({
      description: log.title || log.description || 'Time tracking',
      quantity: Number(log.hours),
      unit_price: formData.hourlyRate,
      amount: Number(log.hours) * formData.hourlyRate,
    }))
    
    const customItemsList = customItems
      .filter(item => item.description.trim() && item.hours > 0)
      .map(item => ({
        description: item.description,
        quantity: Number(item.hours),
        unit_price: formData.hourlyRate,
        amount: Number(item.hours) * formData.hourlyRate,
      }))
    
    return [...timeLogItems, ...customItemsList]
  }, [selectedLogIds, timeLogs, formData.hourlyRate, customItems])

  const handleGenerateInvoice = async () => {
    const hasTimeLogs = selectedLogIds.size > 0
    const hasCustomItems = customItems.some(item => item.description.trim() && item.hours > 0)
    
    if (!formData.invoiceNumber || !formData.clientName || (!hasTimeLogs && !hasCustomItems)) {
      toast.error('Please fill in required fields and select time logs or add custom items')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const total = calculateTotal()
      const selectedLogs = timeLogs.filter(log => selectedLogIds.has(log.id))

      // Create invoice record
      const invoiceData: Partial<Invoice> = {
        user_id: user.id,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        client_name: formData.clientName,
        client_reference: formData.clientReference || undefined,
        from_name: formData.fromName,
        from_abn: formData.fromAbn || undefined,
        from_email: formData.fromEmail || undefined,
        from_phone: formData.fromPhone || undefined,
        bank_name: formData.bankName || undefined,
        bank_bsb: formData.bankBsb || undefined,
        bank_account: formData.bankAccount || undefined,
        bank_account_name: formData.bankAccountName || undefined,
        bank_reference: formData.bankReference || undefined,
        subtotal: total,
        tax_amount: 0,
        total_amount: total,
        currency: formData.currency,
        notes: formData.notes || undefined,
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items from time logs
      const timeLogItems: Partial<InvoiceItem>[] = selectedLogs.map((log, index) => ({
        invoice_id: invoice.id,
        description: log.title || log.description || 'Time tracking',
        quantity: Number(log.hours),
        unit_price: formData.hourlyRate,
        amount: Number(log.hours) * formData.hourlyRate,
        time_log_id: log.id,
        line_order: index,
      }))

      // Create invoice items from custom items
      const customInvoiceItems: Partial<InvoiceItem>[] = customItems
        .filter(item => item.description.trim() && item.hours > 0)
        .map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: Number(item.hours),
          unit_price: formData.hourlyRate,
          amount: Number(item.hours) * formData.hourlyRate,
          time_log_id: undefined,
          line_order: timeLogItems.length + index,
        }))

      const items = [...timeLogItems, ...customInvoiceItems]

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items)

      if (itemsError) throw itemsError

      // Generate PDF
      downloadInvoicePDF({
        invoice: invoice as Invoice,
        items: items as InvoiceItem[],
      })

      toast.success('Invoice generated successfully!')
      onOpenChange(false)
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[95vw] lg:!max-w-[90vw] xl:!max-w-[85vw] w-full bg-white dark:bg-slate-900/95 border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-3xl shadow-xl p-0" 
        style={{ height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-700/50">
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600 dark:text-blue-400" />
            Generate Invoice - Live Preview
          </DialogTitle>
        </div>

        {/* Main content: Form + Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left side: Form (scrollable) */}
          <div className="flex-1 overflow-y-scroll p-6 lg:border-r border-gray-200 dark:border-slate-700/50">
              <div className="space-y-6">
                {/* Invoice Details Section */}
                <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Invoice Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Invoice Number *</Label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Invoice Date *</Label>
                    <Input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Client Name *</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Client Reference</Label>
                  <Input
                    value={formData.clientReference}
                    onChange={(e) => handleInputChange('clientReference', e.target.value)}
                    className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Custom Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Custom Items</h3>
                  <Button
                    type="button"
                    onClick={addCustomItem}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {customItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-start">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300 text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateCustomItem(item.id, 'description', e.target.value)}
                          placeholder="e.g., Freelance work"
                          className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs">Hours</Label>
                        <Input
                          type="number"
                          value={item.hours || ''}
                          onChange={(e) => updateCustomItem(item.id, 'hours', Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          step="0.5"
                          className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                        />
                      </div>
                      {customItems.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeCustomItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

                {/* Time Logs Selection */}
                <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Select Time Logs</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg p-3">
                  {timeLogs.length > 0 ? (
                    timeLogs.map(log => (
                      <label
                        key={log.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLogIds.has(log.id)}
                          onChange={() => toggleLog(log.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{log.title || log.description}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {log.date} • {log.hours}h
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-4">No time logs available</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Hourly Rate</Label>
                    <Input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Currency</Label>
                    <Input
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-teal-50 dark:bg-blue-500/10 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Selected: {selectedLogIds.size} logs
                    {customItems.filter(item => item.description.trim() && item.hours > 0).length > 0 && 
                      ` + ${customItems.filter(item => item.description.trim() && item.hours > 0).length} custom items`
                    }
                  </div>
                  <div className="text-2xl font-bold text-teal-600 dark:text-blue-400 mt-1">
                    {formData.currency} {calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

                {/* Business Details Section */}
                <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Your Business Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">From (Name)</Label>
                    <Input
                      value={formData.fromName}
                      onChange={(e) => handleInputChange('fromName', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">ABN</Label>
                    <Input
                      value={formData.fromAbn}
                      onChange={(e) => handleInputChange('fromAbn', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                    <Input
                      value={formData.fromEmail}
                      onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Phone</Label>
                    <Input
                      value={formData.fromPhone}
                      onChange={(e) => handleInputChange('fromPhone', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

                {/* Bank Details Section */}
                <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Bank Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Bank Name</Label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">BSB</Label>
                    <Input
                      value={formData.bankBsb}
                      onChange={(e) => handleInputChange('bankBsb', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Account Number</Label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Account Name</Label>
                    <Input
                      value={formData.bankAccountName}
                      onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-gray-700 dark:text-gray-300">Payment Reference</Label>
                    <Input
                      value={formData.bankReference}
                      onChange={(e) => handleInputChange('bankReference', e.target.value)}
                      className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

                {/* Notes Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notes (Optional)</h3>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Add additional notes or instructions..."
                  />
                </div>
              </div>
            </div>

          {/* Right side: Live Preview */}
          <div className="flex-1 overflow-y-scroll bg-gray-100 dark:bg-slate-800/40 p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Live Preview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preview updates in real-time</p>
            </div>
            <InvoicePreview
              invoice={previewInvoice}
              items={previewItems}
              currency={formData.currency}
            />
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700/50 flex justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={loading || (!selectedLogIds.size && !customItems.some(item => item.description.trim() && item.hours > 0)) || !formData.clientName}
              className="bg-teal-600 hover:bg-teal-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              {loading ? 'Generating...' : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  )
}
