-- Tussencheck / Herinspectie fase
-- Voegt project-fase en interim-review velden toe aan Project en Finding.

-- 1. Nieuwe enum voor project-fase
CREATE TYPE "ProjectCheckPhase" AS ENUM ('nulmeting', 'tussencheck', 'herinspectie', 'afgerond');

-- 2. Project: drie nieuwe velden
ALTER TABLE "projects"
  ADD COLUMN "check_phase" "ProjectCheckPhase" NOT NULL DEFAULT 'nulmeting',
  ADD COLUMN "check_phase_started_at" TIMESTAMP(3),
  ADD COLUMN "interim_check_label" TEXT;

-- 3. Finding: drie nieuwe velden
ALTER TABLE "findings"
  ADD COLUMN "interim_reviewed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "interim_notes" TEXT,
  ADD COLUMN "discovered_in_phase" "ProjectCheckPhase" NOT NULL DEFAULT 'nulmeting';

-- 4. Backfill: bestaande herinspectie-projecten (version 1.1) krijgen check_phase=tussencheck
--    zodra hun parent (versie 1.0) status 'Gereed' heeft. Anders blijven ze nulmeting (default).
UPDATE "projects" AS y
SET "check_phase" = 'tussencheck'
FROM "projects" AS x
WHERE y."parent_project_id" = x."id"
  AND y."version" = 1.1
  AND x."status" = 'Gereed';

-- 5. Backfill: bestaande Findings behouden discovered_in_phase=nulmeting (al de default).
--    Findings die in een herinspectie-project staan (version 1.1) zijn historisch
--    gekopieerd uit nulmeting, dus discovered_in_phase=nulmeting blijft correct.
