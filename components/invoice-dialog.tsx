'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { TimeLog, Invoice, InvoiceItem, InvoiceSettings } from '@/types'
import { downloadInvoicePDF } from '@/lib/invoice-generator'
import { toast } from 'sonner'
import { FileText, Download, ChevronRight, ChevronLeft } from 'lucide-react'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<InvoiceSettings | null>(null)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
  
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
      setStep(1)
      setSelectedLogIds(new Set())
    }
  }, [open])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettings(data)
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
    
    const { data, error } = await supabase
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
    const totalHours = selectedLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0)
    return totalHours * formData.hourlyRate
  }

  const handleGenerateInvoice = async () => {
    if (!formData.invoiceNumber || !formData.clientName || selectedLogIds.size === 0) {
      toast.error('Please fill in required fields and select time logs')
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

      // Create invoice items
      const items: Partial<InvoiceItem>[] = selectedLogs.map((log, index) => ({
        invoice_id: invoice.id,
        description: log.title || log.description || 'Time tracking',
        quantity: Number(log.hours),
        unit_price: formData.hourlyRate,
        amount: Number(log.hours) * formData.hourlyRate,
        time_log_id: log.id,
        line_order: index,
      }))

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

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black/95 border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600 dark:text-blue-400" />
            Generate Invoice
          </DialogTitle>
          <div className="flex gap-2 mt-4">
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-teal-500 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-teal-500 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-teal-500 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1: Invoice Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Invoice Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
          )}

          {/* Step 2: Select Time Logs + Business/Bank Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Select Time Logs</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timeLogs.map(log => (
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
                  ))}
                </div>
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
                <div className="text-sm text-gray-600 dark:text-gray-300">Selected: {selectedLogIds.size} logs</div>
                <div className="text-2xl font-bold text-teal-600 dark:text-blue-400 mt-1">
                  {formData.currency} {calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business/Bank Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Your Business Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
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

              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mt-6">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="col-span-2">
                  <Label className="text-gray-700 dark:text-gray-300">Payment Reference</Label>
                  <Input
                    value={formData.bankReference}
                    onChange={(e) => handleInputChange('bankReference', e.target.value)}
                    className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              onClick={prevStep}
              disabled={step === 1}
              variant="outline"
              className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={nextStep}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateInvoice}
                disabled={loading || selectedLogIds.size === 0}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                {loading ? 'Generating...' : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
