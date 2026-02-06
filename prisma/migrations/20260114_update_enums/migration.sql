-- AlterEnum
-- Add 'serieus' to FindingImpact enum
ALTER TYPE "FindingImpact" ADD VALUE IF NOT EXISTS 'serieus';

-- AlterEnum
-- Remove 'onbekend' from FindingImpact enum (first set all NULL where it was onbekend)
UPDATE "findings" SET "impact" = NULL WHERE "impact" = 'onbekend';
-- We can't directly remove an enum value, so we'll leave it for now
-- If you want to clean this up later, you'll need to recreate the enum

-- AlterEnum
-- Remove 'onbekend' from FindingResponsibility enum (first set all NULL where it was onbekend)
UPDATE "findings" SET "responsibility" = NULL WHERE "responsibility" = 'onbekend';
-- We can't directly remove an enum value, so we'll leave it for now