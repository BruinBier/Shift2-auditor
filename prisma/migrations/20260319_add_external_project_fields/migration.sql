-- Add external project fields to projects table
ALTER TABLE "projects" ADD COLUMN "is_external_project" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "external_bureau" TEXT;