-- Add management_summary and researcher_feedback columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_summary TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS researcher_feedback TEXT;