-- Twee vaststellingen per sample, gezet door de onderzoeker bij de steekproef.
--
-- heeft_bewegend_beeld = false sluit 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5 en 2.1.4 af.
-- heeft_formulier      = false sluit 3.3.1, 3.3.2, 3.3.3 en 3.3.7 af.
--
-- Allebei nullable ZONDER default: NULL betekent "niet vastgesteld" en dan
-- beoordeelt de agent zoals altijd. Een default van false zou elke bestaande
-- sample in één klap tien criteria laten overslaan zonder dat iemand dat heeft
-- vastgesteld -- precies de stille versmalling die dit veld moet voorkomen.
--
-- Bestaande rijen krijgen daarom NULL en er verandert niets aan lopend werk.

ALTER TABLE "sample_items" ADD COLUMN "heeft_bewegend_beeld" BOOLEAN;
ALTER TABLE "sample_items" ADD COLUMN "heeft_formulier" BOOLEAN;
