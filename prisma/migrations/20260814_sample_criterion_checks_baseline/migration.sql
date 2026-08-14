-- Baseline voor sample_criterion_checks.
--
-- Deze tabel bestond al in de productiedatabase — aangemaakt op 3 augustus 2026,
-- met 1290 rijen, waaronder de volledige matrix van UTHEU-01 (20 samples x 33
-- criteria) — maar ontbrak zowel in schema.prisma als in de migratiegeschiedenis.
-- Daardoor wist Prisma niet dat hij bestond, en zou `prisma migrate dev` hem
-- weggooien.
--
-- Deze migratie brengt de geschiedenis in lijn met de werkelijkheid. Alles is
-- idempotent: op de bestaande database verandert er niets, op een verse database
-- wordt de tabel alsnog aangemaakt.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SampleCheckStatus') THEN
    CREATE TYPE "SampleCheckStatus" AS ENUM (
      'voldoet',
      'afgekeurd',
      'opmerking',
      'niet_aanwezig',
      'niet_te_bepalen'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SampleCheckBron') THEN
    CREATE TYPE "SampleCheckBron" AS ENUM ('workflow', 'gesprek', 'handmatig');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SampleCheckAkkoord') THEN
    CREATE TYPE "SampleCheckAkkoord" AS ENUM ('voorgesteld', 'akkoord', 'afgewezen');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "sample_criterion_checks" (
  "id" TEXT NOT NULL,
  "sample_item_id" TEXT NOT NULL,
  "wcag_criterion_id" TEXT NOT NULL,
  "status" "SampleCheckStatus" NOT NULL,
  "reden" TEXT,
  "bron" "SampleCheckBron" NOT NULL DEFAULT 'workflow',
  "akkoord" "SampleCheckAkkoord",
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sample_criterion_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sample_criterion_checks_sample_item_id_wcag_criterion_id_key"
  ON "sample_criterion_checks"("sample_item_id", "wcag_criterion_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sample_criterion_checks_sample_item_id_fkey'
  ) THEN
    ALTER TABLE "sample_criterion_checks"
      ADD CONSTRAINT "sample_criterion_checks_sample_item_id_fkey"
      FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sample_criterion_checks_wcag_criterion_id_fkey'
  ) THEN
    ALTER TABLE "sample_criterion_checks"
      ADD CONSTRAINT "sample_criterion_checks_wcag_criterion_id_fkey"
      FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
