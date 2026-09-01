-- AlterTable
ALTER TABLE "projects"
  ADD COLUMN "scope_in_scope"      TEXT,
  ADD COLUMN "scope_out_of_scope"  TEXT,
  ADD COLUMN "sample_client_pages" TEXT;
