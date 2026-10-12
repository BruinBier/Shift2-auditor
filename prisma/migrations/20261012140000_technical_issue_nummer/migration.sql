-- Vast volgnummer per technisch issue (TI-1, TI-2, ...). Bestaande issues krijgen een
-- nummer op volgorde van aanmaken; nieuwe issues krijgen het volgende uit de reeks.
ALTER TABLE "technical_issues" ADD COLUMN "nummer" INTEGER;

UPDATE "technical_issues" t
SET "nummer" = r.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS rn FROM "technical_issues") r
WHERE t."id" = r."id";

CREATE SEQUENCE "technical_issues_nummer_seq" OWNED BY "technical_issues"."nummer";
SELECT setval('"technical_issues_nummer_seq"', COALESCE((SELECT MAX("nummer") FROM "technical_issues"), 0) + 1, false);

ALTER TABLE "technical_issues" ALTER COLUMN "nummer" SET DEFAULT nextval('"technical_issues_nummer_seq"');
ALTER TABLE "technical_issues" ALTER COLUMN "nummer" SET NOT NULL;

CREATE UNIQUE INDEX "technical_issues_nummer_key" ON "technical_issues"("nummer");
