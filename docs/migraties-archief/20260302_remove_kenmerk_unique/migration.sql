-- Remove unique constraint from kenmerk to allow v1.0 and v1.1 to share the same kenmerk
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_kenmerk_key";