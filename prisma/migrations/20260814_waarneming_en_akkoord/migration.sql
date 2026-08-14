-- De rest van het poortontwerp: het spoor van het akkoord, de reden van een
-- afwijzing, de doorzet naar een technisch issue, en het model voor waarnemingen.
-- Zie docs/adr/0001-akkoord-als-poort.md.
--
-- Het oordeel per sample per criterium zit niet in deze migratie: die tabel
-- bestond al en is opgenomen in 20260814_sample_criterion_checks_baseline.

-- 1. De staat van een ruwe waarneming.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WaarnemingStatus') THEN
    CREATE TYPE "WaarnemingStatus" AS ENUM ('open', 'uitgewerkt', 'vervallen');
  END IF;
END
$$;

-- 2. Velden op findings. akkoord_op blijft leeg voor bestaande bevindingen: die
--    datum is er niet, en wordt niet verzonnen.
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "akkoord_op" TIMESTAMP(3);
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "afwijzingsreden" TEXT;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "technical_issue_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'findings_technical_issue_id_fkey'
  ) THEN
    ALTER TABLE "findings"
      ADD CONSTRAINT "findings_technical_issue_id_fkey"
      FOREIGN KEY ("technical_issue_id") REFERENCES "technical_issues"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- 3. Waarnemingen: de ruwe observaties van de onderzoeker. Eigen tabel en geen
--    finding met een lege status, omdat een finding een verplicht criterium
--    heeft — en dat bepalen is nu juist het werk dat nog moet gebeuren.
CREATE TABLE IF NOT EXISTS "waarnemingen" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "sample_item_id" TEXT,
  "url" TEXT,
  "tekst" TEXT NOT NULL,
  "screenshot_path" TEXT,
  "status" "WaarnemingStatus" NOT NULL DEFAULT 'open',
  "finding_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "waarnemingen_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waarnemingen_project_id_fkey') THEN
    ALTER TABLE "waarnemingen"
      ADD CONSTRAINT "waarnemingen_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waarnemingen_sample_item_id_fkey') THEN
    ALTER TABLE "waarnemingen"
      ADD CONSTRAINT "waarnemingen_sample_item_id_fkey"
      FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waarnemingen_finding_id_fkey') THEN
    ALTER TABLE "waarnemingen"
      ADD CONSTRAINT "waarnemingen_finding_id_fkey"
      FOREIGN KEY ("finding_id") REFERENCES "findings"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
