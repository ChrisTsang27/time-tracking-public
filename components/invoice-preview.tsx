'use client'

import { Invoice } from '@/types'

interface InvoicePreviewProps {
  invoice: Partial<Invoice>
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
  currency: string
}

export default function InvoicePreview({ invoice, items, currency }: InvoicePreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const total = subtotal + (invoice.tax_amount || 0)

  // Format date
  const formattedDate = invoice.invoice_date 
    ? new Date(invoice.invoice_date).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : ''

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">TAX INVOICE</h1>
        
        {/* From Section */}
        <div className="mb-6">
          <p className="font-semibold text-gray-900">
            {invoice.from_name || <span className="text-gray-400">Your Business Name</span>}
          </p>
          {invoice.from_abn && (
            <p className="text-sm text-gray-700">ABN: {invoice.from_abn}</p>
          )}
          {invoice.from_email && (
            <p className="text-sm text-gray-700">Email: {invoice.from_email}</p>
          )}
          {invoice.from_phone && (
            <p className="text-sm text-gray-700">Phone: {invoice.from_phone}</p>
          )}
        </div>

        {/* To Section */}
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">To: </span>
            {invoice.client_name || <span className="text-gray-400">Client Name</span>}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Date: </span>
            {formattedDate || <span className="text-gray-400">Invoice Date</span>}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Invoice No: </span>
            {invoice.invoice_number || <span className="text-gray-400">INV-XXXXXX</span>}
          </p>
          {invoice.client_reference && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Reference: </span>
              {invoice.client_reference}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 font-semibold text-gray-900 border-b border-gray-300">
                Description
              </th>
              <th className="text-right p-3 font-semibold text-gray-900 border-b border-gray-300">
                Amount ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3 text-gray-800">{item.description}</td>
                  <td className="p-3 text-right text-gray-800">
                    {currency} {item.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-3 text-center text-gray-400 italic">
                  No items selected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mb-8 flex justify-between items-center border-t-2 border-gray-300 pt-4">
        <span className="text-lg font-bold text-gray-900">TOTAL</span>
        <span className="text-lg font-bold text-gray-900">
          {currency} {total.toFixed(2)}
        </span>
      </div>

      {/* Bank Details */}
      {(invoice.bank_name || invoice.bank_bsb || invoice.bank_account) && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
          {invoice.bank_name && (
            <p className="text-sm text-gray-700">Bank: {invoice.bank_name}</p>
          )}
          {invoice.bank_bsb && (
            <p className="text-sm text-gray-700">BSB: {invoice.bank_bsb}</p>
          )}
          {invoice.bank_account && (
            <p className="text-sm text-gray-700">Account: {invoice.bank_account}</p>
          )}
          {invoice.bank_account_name && (
            <p className="text-sm text-gray-700">Account name: {invoice.bank_account_name}</p>
          )}
          {invoice.bank_reference && (
            <p className="text-sm text-gray-700">Reference: {invoice.bank_reference}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Empty state hint */}
      {!invoice.client_name && items.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Fill in the form to see live preview</p>
        </div>
      )}
    </div>
  )
}

