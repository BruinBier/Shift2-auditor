-- Twee kolommen op de sampleoordelen: waarop het oordeel rust, en of dat standhoudt.
--
-- Waarom niet in `reden`: de poort kijkt naar die tekst. Verandert hij, dan vervalt het
-- akkoord van de onderzoeker — dat is met opzet zo, want een bevestiging hoort bij de
-- tekst die iemand las. Zou de verantwoording daarin staan, dan trok elke nieuwe
-- meetronde stilzwijgend goedkeuringen in.
--
-- `verantwoording` wordt gevuld uit het logboek van de audit-CLI, niet door een agent.
-- Een agent die zijn eigen bronnenlijst opschrijft levert een bewering; de CLI legt vast
-- wat hij werkelijk draait.
--
-- `controle` bevat per punt uit wcag-regels/Shift2_Bewijsvoering.md of de onderbouwing
-- eraan voldoet. Een "nee" hier betekent niet dat het oordeel fout is, maar dat de
-- onderbouwing het niet draagt.
--
-- Beide zijn nullable en zonder standaardwaarde: bestaande rijen dateren van voor deze
-- manier van werken en horen leeg te blijven. Leeg betekent "geen meting vastgelegd",
-- en dat is informatie, geen gebrek.

ALTER TABLE "sample_criterion_checks"
  ADD COLUMN IF NOT EXISTS "verantwoording" JSONB,
  ADD COLUMN IF NOT EXISTS "controle" JSONB;
