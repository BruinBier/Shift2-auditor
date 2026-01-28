-- Add status column to quick_findings table
ALTER TABLE quick_findings
ADD COLUMN IF NOT EXISTS status "FindingStatus";

-- Optional: Set default status for existing records
-- UPDATE quick_findings SET status = 'open' WHERE status IS NULL;