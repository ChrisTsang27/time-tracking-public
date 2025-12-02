-- Invoice System Migration
-- Creates tables for storing business settings and invoice data

-- Business/Invoice Settings (stores user's business details)
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- From (Your business details)
  from_name TEXT NOT NULL,
  from_abn TEXT,
  from_email TEXT,
  from_phone TEXT,
  
  -- Bank Details
  bank_name TEXT,
  bank_bsb TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  
  -- Default Settings
  default_hourly_rate DECIMAL(10, 2),
  default_currency TEXT DEFAULT 'AUD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Invoices (stores generated invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  
  -- Client Details
  client_name TEXT NOT NULL,
  client_reference TEXT,
  
  -- Custom content (user can override defaults)
  from_name TEXT,
  from_abn TEXT,
  from_email TEXT,
  from_phone TEXT,
  bank_name TEXT,
  bank_bsb TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  bank_reference TEXT,
  
  -- Totals
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items (links to time logs or custom items)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item Details
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL, -- hours or units
  unit_price DECIMAL(10, 2) NOT NULL, -- hourly rate or price
  amount DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  
  -- Optional link to time log
  time_log_id UUID REFERENCES time_logs(id) ON DELETE SET NULL,
  
  -- Order
  line_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_settings
CREATE POLICY "Users can view their own invoice settings"
  ON invoice_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice settings"
  ON invoice_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice settings"
  ON invoice_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoice items for their invoices"
  ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice items for their invoices"
  ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoice items for their invoices"
  ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_time_log_id ON invoice_items(time_log_id);
