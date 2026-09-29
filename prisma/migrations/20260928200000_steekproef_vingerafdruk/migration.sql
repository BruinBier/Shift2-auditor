-- Steekproefselectie v2, fase 3: structuurvingerafdruk per kandidaat (sjabloonclusters, schaduw).
-- Alleen een nieuwe, lege kolom op een tabel van fase 1.

-- AlterTable
ALTER TABLE "inventaris_kandidaten" ADD COLUMN     "vingerafdruk" JSONB;

