-- quick_findings: status, impact en responsibility van tekst naar enum.
--
-- Deze drie kolommen stonden in schema.prisma al als enum, maar in de database
-- als tekst. Daardoor wilde Prisma ze weggooien en opnieuw aanmaken — met verlies
-- van de gegevens van 130 QuickFindings. Dat is hier omgezet in plaats van
-- opnieuw aangemaakt.
--
-- Alle bestaande waarden zijn gecontroleerd en passen binnen de bestaande enums:
--   status          open (111), resolved (16), leeg (3)
--   impact          klein (70), matig (39), onbekend (9), serieus (8), leeg (4)
--   responsibility  redacteur (80), ontwikkelaar (33), ontwerper (9), onbekend (4), leeg (4)
--
-- Zou er ooit toch een afwijkende waarde in staan, dan faalt de USING-cast en
-- stopt de migratie. Dat is de bedoeling: liever een duidelijke fout dan stille
-- gegevensverlies.
--
-- Idempotent: draait alleen als de kolom nog tekst is.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_findings' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "quick_findings"
      ALTER COLUMN "status" TYPE "FindingStatus" USING "status"::"FindingStatus";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_findings' AND column_name = 'impact' AND data_type = 'text'
  ) THEN
    ALTER TABLE "quick_findings"
      ALTER COLUMN "impact" TYPE "FindingImpact" USING "impact"::"FindingImpact";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_findings' AND column_name = 'responsibility' AND data_type = 'text'
  ) THEN
    ALTER TABLE "quick_findings"
      ALTER COLUMN "responsibility" TYPE "FindingResponsibility"
      USING "responsibility"::"FindingResponsibility";
  END IF;
END
$$;
