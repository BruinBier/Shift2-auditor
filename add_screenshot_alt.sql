-- Add screenshot_alt column to sample_items table
ALTER TABLE sample_items ADD COLUMN IF NOT EXISTS screenshot_alt TEXT;