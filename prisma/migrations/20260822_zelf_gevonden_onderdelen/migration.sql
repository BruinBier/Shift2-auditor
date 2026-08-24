-- De onderdelen die de onderzoeker zélf vond, naast wat de meting vond.
--
-- Bij 3.2.4 legt `get-consistentie` de pagina's van de steekproef naast elkaar en meldt
-- welke onderdelen niet overal hetzelfde heten. Dat vindt niet alles: een onderdeel dat
-- pas na een klik verschijnt, een pagina buiten de steekproef, of twee elementen die de
-- sleutel niet aan elkaar koppelt. Wat de auditor met eigen ogen vindt hoort in dezelfde
-- lijst te staan als wat gemeten is — anders bestaat het alleen in zijn hoofd, of als
-- losse zin in een notitieveld.
--
-- Waarom een eigen kolom en niet een van de bestaande:
--
--   `verantwoording` is voor metingen uit het logboek van de CLI. Daar handwerk in
--   schrijven maakt van een waarneming een meting, en dat is precies het onderscheid
--   dat die kolom bewaakt.
--
--   `reden` kan niet: de poort kijkt naar die tekst, dus een toevoeging zou het akkoord
--   van de onderzoeker laten vervallen. Iets aan je eigen lijst toevoegen hoort je
--   eerdere bevestiging niet in te trekken.
--
--   `waarnemingen` is vrije tekst bij een pagina en hangt niet aan een criterium. Ruw
--   bedoeld, en het zou nooit in de lijst van dit criterium terechtkomen.
--
-- Nullable en zonder standaardwaarde: leeg betekent dat de onderzoeker niets heeft
-- toegevoegd, en dat is de normale toestand.

ALTER TABLE "sample_criterion_checks"
  ADD COLUMN IF NOT EXISTS "zelf_gevonden" JSONB;
