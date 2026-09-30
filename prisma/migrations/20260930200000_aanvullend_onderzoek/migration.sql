-- Aanvullend onderzoek: een hertest die werkt als een herinspectie maar zo niet heet.
-- Alleen een kolom erbij, met standaardwaarde; bestaande rijen worden false.

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "aanvullend_onderzoek" BOOLEAN NOT NULL DEFAULT false;
