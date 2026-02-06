-- AlterTable: Change version from DECIMAL to DOUBLE PRECISION (Float)
ALTER TABLE "projects" ALTER COLUMN "version" SET DATA TYPE DOUBLE PRECISION;