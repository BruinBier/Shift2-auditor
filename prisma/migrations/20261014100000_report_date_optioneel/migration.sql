-- Rapportdatum optioneel: bij een intake is hij nog niet bekend. Bestaande waarden blijven staan.
ALTER TABLE "projects" ALTER COLUMN "report_date" DROP NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "report_date" DROP DEFAULT;
