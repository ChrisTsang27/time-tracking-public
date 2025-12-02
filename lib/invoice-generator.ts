import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, InvoiceItem } from '@/types'

export interface GenerateInvoiceOptions {
  invoice: Invoice
  items: InvoiceItem[]
}

export function generateInvoicePDF(options: GenerateInvoiceOptions): jsPDF {
  const { invoice, items } = options
  const doc = new jsPDF()
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = 20

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 70, 120) // Blue color
  doc.text('TAX INVOICE', margin, yPosition)
  yPosition += 15

  // From Section
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`From: ${invoice.from_name || ''}`, margin, yPosition)
  yPosition += 5
  
  if (invoice.from_abn) {
    doc.text(`ABN: ${invoice.from_abn}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.from_email) {
    doc.text(`Email: ${invoice.from_email}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.from_phone) {
    doc.text(`Phone: ${invoice.from_phone}`, margin, yPosition)
    yPosition += 5
  }
  
  yPosition += 5

  // To Section
  doc.text(`To: ${invoice.client_name}`, margin, yPosition)
  yPosition += 5
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-AU', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })}`, margin, yPosition)
  yPosition += 5
  doc.text(`Invoice No: ${invoice.invoice_number}`, margin, yPosition)
  yPosition += 5
  
  if (invoice.client_reference) {
    doc.text(`Reference: ${invoice.client_reference}`, margin, yPosition)
    yPosition += 5
  }
  
  yPosition += 10

  // Items Table
  const tableData = items.map(item => [
    item.description,
    `${invoice.currency} ${item.amount.toFixed(2)}`
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', `Amount (${invoice.currency})`]],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  // Get Y position after table
  yPosition = (doc as any).lastAutoTable.finalY + 5

  // Total
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', margin, yPosition)
  doc.text(`${invoice.currency} ${invoice.total_amount.toFixed(2)}`, pageWidth - margin - 50, yPosition, { align: 'right' })
  yPosition += 15

  // Bank Details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  if (invoice.bank_name) {
    doc.text(`Bank: ${invoice.bank_name}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.bank_bsb) {
    doc.text(`BSB: ${invoice.bank_bsb}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.bank_account) {
    doc.text(`Account: ${invoice.bank_account}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.bank_account_name) {
    doc.text(`Account name: ${invoice.bank_account_name}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.bank_reference) {
    doc.text(`Reference: ${invoice.bank_reference}`, margin, yPosition)
    yPosition += 5
  }

  // Notes (if any)
  if (invoice.notes) {
    yPosition += 10
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPosition)
  }

  return doc
}

export function downloadInvoicePDF(options: GenerateInvoiceOptions, filename?: string) {
  const doc = generateInvoicePDF(options)
  const downloadFilename = filename || `Invoice_${options.invoice.invoice_number}.pdf`
  doc.save(downloadFilename)
}

export function previewInvoicePDF(options: GenerateInvoiceOptions): string {
  const doc = generateInvoicePDF(options)
  return doc.output('datauristring')
}
