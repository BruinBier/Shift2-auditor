-- Bij een extern bureau (Cardan) bepaalt dat bureau de scope met de klant, dus de tool
-- verbergt daar de stappen scopegesprek, transcript en scope. Soms moet de onderzoeker
-- toch zelf met de klant om tafel: bij WAAL-02 over een DigiD-testomgeving, waarvan het
-- antwoord naar Cardan moet voordat die een startdatum kan geven. Daar was geen stap voor.
--
-- scope_call_wanted:    schakelaar "Scope zelf met de klant bespreken" bij een bureau-project;
--                       zet de vier scopestappen aan met dezelfde bewaking als bij Shift2.
-- scope_sent_to_bureau: wanneer de uitkomst van dat gesprek aan het bureau is doorgegeven;
--                       vanaf dan telt het wachten op de startdatum, niet vanaf het
--                       oorspronkelijke planningsverzoek.

ALTER TABLE "projects" ADD COLUMN "scope_call_wanted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "scope_sent_to_bureau" TIMESTAMP(6);
