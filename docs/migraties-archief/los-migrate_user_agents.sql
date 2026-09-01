-- Migration: Change user_agents from text[] to text
-- This migration converts the user_agents column from an array to a text field with HTML

-- Step 1: Add a temporary column to hold the converted data
ALTER TABLE projects ADD COLUMN user_agents_temp TEXT;

-- Step 2: Convert existing array data to HTML paragraphs
UPDATE projects
SET user_agents_temp = CASE
  WHEN user_agents IS NULL OR array_length(user_agents, 1) IS NULL THEN ''
  ELSE '<p>' || array_to_string(user_agents, '</p><p>') || '</p>'
END;

-- Step 3: Drop the old array column
ALTER TABLE projects DROP COLUMN user_agents;

-- Step 4: Rename the temp column to user_agents
ALTER TABLE projects RENAME COLUMN user_agents_temp TO user_agents;