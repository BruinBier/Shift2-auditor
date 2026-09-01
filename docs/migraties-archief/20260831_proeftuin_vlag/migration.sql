-- Een proeftuin: intern werk om de werkwijze te verfijnen, geen klantonderzoek.
--
-- Zulke projecten horen niet in de lijst met onderzoeken; daar staan alleen de echte
-- onderzoeken. Een schakelaar boven die lijst haalt ze erbij wanneer je erin wilt werken.
--
-- Waarom een kolom en niet een afspraak over de naam: "TEST-" vooraan werkt alleen zolang
-- iedereen die afspraak kent en er niets op filtert. Hier kan code op beslissen.
--
-- Bestaande projecten zijn geen proeftuin: default false, geen backfill nodig.
ALTER TABLE "projects" ADD COLUMN "is_proeftuin" BOOLEAN NOT NULL DEFAULT false;
