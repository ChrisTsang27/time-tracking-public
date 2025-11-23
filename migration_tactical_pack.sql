-- Add category and tags columns to time_logs table
ALTER TABLE time_logs 
ADD COLUMN category text DEFAULT 'Work',
ADD COLUMN tags text[] DEFAULT '{}';

-- Create an index for faster filtering by category
CREATE INDEX idx_time_logs_category ON time_logs(category);
