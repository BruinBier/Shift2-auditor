-- Voorbeeld-URL bij een technisch issue, Nederlands en Engels (detailpagina).
ALTER TABLE "technical_issues" ADD COLUMN "url" TEXT;
ALTER TABLE "technical_issues" ADD COLUMN "url_en" TEXT;
