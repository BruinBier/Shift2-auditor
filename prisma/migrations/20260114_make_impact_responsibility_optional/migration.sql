-- AlterTable
-- First, make the columns nullable
ALTER TABLE "findings" ALTER COLUMN "impact" DROP NOT NULL;
ALTER TABLE "findings" ALTER COLUMN "impact" DROP DEFAULT;
ALTER TABLE "findings" ALTER COLUMN "responsibility" DROP NOT NULL;
ALTER TABLE "findings" ALTER COLUMN "responsibility" DROP DEFAULT;

-- Then update existing 'onbekend' values to NULL
UPDATE "findings" SET "impact" = NULL WHERE "impact" = 'onbekend';
UPDATE "findings" SET "responsibility" = NULL WHERE "responsibility" = 'onbekend';