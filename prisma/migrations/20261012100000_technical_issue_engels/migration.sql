-- Engelse vertaling van een technisch issue (knop "Vertaal naar Engels" op de detailpagina).
ALTER TABLE "technical_issues" ADD COLUMN "title_en" TEXT;
ALTER TABLE "technical_issues" ADD COLUMN "description_en" TEXT;
ALTER TABLE "technical_issues" ADD COLUMN "vertaald_op" TIMESTAMP(3);
