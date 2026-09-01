-- Add herinspectie fields to projects table
ALTER TABLE "projects" ADD COLUMN "parent_project_id" TEXT;
ALTER TABLE "projects" ADD COLUMN "has_reinspection" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "reinspection_weeks" INTEGER;

-- Add foreign key constraint for parent_project_id
ALTER TABLE "projects" ADD CONSTRAINT "projects_parent_project_id_fkey"
  FOREIGN KEY ("parent_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;