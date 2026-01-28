-- Add sort_order column to findings table
ALTER TABLE findings ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on creation date for existing findings
UPDATE findings
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id, wcag_criterion_id ORDER BY created_at) - 1 AS row_num
  FROM findings
) AS subquery
WHERE findings.id = subquery.id;