-- Bevinding of opmerking wordt een eigen veld.
--
-- Tot nu toe werd dit afgeleid uit `impact`: impact gezet = bevinding,
-- impact leeg = opmerking. Dat liet `impact` twee dingen tegelijk betekenen
-- (de ernst, én het oordeel of iets een afkeuring is), waardoor het weghalen
-- van een impact een bevinding stilzwijgend in een opmerking veranderde.
--
-- Stap 1: veld toevoegen en vullen volgens de bestaande regel. Nog geen
-- gedragsverandering in de applicatie; die volgt per plek.

CREATE TYPE "FindingType" AS ENUM ('bevinding', 'opmerking');

ALTER TABLE "findings"
  ADD COLUMN "type" "FindingType" NOT NULL DEFAULT 'bevinding';

-- Vullen volgens de regel die tot nu toe overal in de code stond.
UPDATE "findings" SET "type" = 'opmerking' WHERE "impact" IS NULL;
UPDATE "findings" SET "type" = 'bevinding' WHERE "impact" IS NOT NULL;
