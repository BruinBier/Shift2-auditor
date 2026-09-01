-- Add notes column to findings table
ALTER TABLE findings ADD COLUMN IF NOT EXISTS notes TEXT;
