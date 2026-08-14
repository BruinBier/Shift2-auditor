-- Nieuwe statussen voor een bevinding: 'voorstel' als poort, 'afgewezen' als
-- zijspoor. Zie docs/adr/0001-akkoord-als-poort.md.
--
-- Deze twee regels staan bewust in een eigen migratie. PostgreSQL staat niet toe
-- dat een enumwaarde wordt gebruikt in dezelfde transactie waarin hij is
-- toegevoegd, en Prisma draait elke migratie als één transactie. Door het te
-- splitsen zijn de waarden gecommit voordat de volgende migratie ze aanraakt.
--
-- Bestaande bevindingen staan op 'open' of verder en gelden daarmee als akkoord;
-- er is geen datamigratie nodig.
--
-- Let op: ADD VALUE is niet terug te draaien. Een enumwaarde verwijderen kan in
-- PostgreSQL alleen door het hele type te herbouwen.

ALTER TYPE "FindingStatus" ADD VALUE IF NOT EXISTS 'voorstel' BEFORE 'open';
ALTER TYPE "FindingStatus" ADD VALUE IF NOT EXISTS 'afgewezen' AFTER 'resolved';
