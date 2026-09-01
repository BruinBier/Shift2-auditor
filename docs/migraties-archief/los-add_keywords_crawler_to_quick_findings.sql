-- Add keywords and crawler columns to quick_findings table
ALTER TABLE quick_findings
ADD COLUMN IF NOT EXISTS keywords TEXT,
ADD COLUMN IF NOT EXISTS crawler BOOLEAN DEFAULT false;