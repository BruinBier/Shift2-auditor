-- Het PAC-rapport van een PDF-sample, opgeborgen bij de sample zelf.
--
-- PAC toetst de kwaliteit van de tags (leesvolgorde, kopniveaus, lijst- en
-- tabelstructuur); dat is niet uit de ruwe bytes te lezen. Zonder die uitvoer gaan de
-- criteria die ervan afhangen op niet_te_bepalen -- zie stap 2 in
-- Shift2_Werkwijze_PDF.md.
--
-- Tot nu toe werd de uitvoer in de chat gedeeld en was hij daarna weg, waardoor de
-- volgende agent hem opnieuw vroeg. De werkafspraak zegt dat de onderzoeker een bestand
-- maar één keer door PAC hoeft te halen; zonder bewaarplek was dat niet waar te maken.
--
-- pac_rapport_op staat erbij omdat een rapport van vóór een nieuwe versie van het
-- document niets meer zegt over het document dat er nu staat.
--
-- Beide nullable zonder default; bestaande rijen krijgen NULL.

ALTER TABLE "sample_items" ADD COLUMN "pac_rapport_path" TEXT;
ALTER TABLE "sample_items" ADD COLUMN "pac_rapport_op" TIMESTAMP(3);
