-- Add projectnummer column to client_projects table
ALTER TABLE "client_projects" ADD COLUMN IF NOT EXISTS "projectnummer" TEXT;