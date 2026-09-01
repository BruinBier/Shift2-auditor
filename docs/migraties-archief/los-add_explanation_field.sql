-- Add explanation field to criterion_assessments table
ALTER TABLE criterion_assessments ADD COLUMN IF NOT EXISTS explanation TEXT;