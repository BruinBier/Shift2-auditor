-- Een vierde herkomst voor een sample-oordeel: de steekproef.
--
-- Staat een vinkje op het tabblad Steekproef op "niet aanwezig", dan volgt het
-- oordeel daaruit zonder dat er een agent aan te pas komt. Dat is een andere weg
-- dan 'workflow' (een agent schreef het), 'gesprek' (besloten in een gesprek) of
-- 'handmatig' (los ingevoerd op de kaart), en de kaart moet dat kunnen tonen:
-- "er staat geen video" ziet er anders hetzelfde uit als niet-gekeken-hebben.
--
-- ADD VALUE is niet terug te draaien in PostgreSQL. Dat is hier geen bezwaar:
-- de waarde wordt alleen toegevoegd, bestaande rijen veranderen niet.

ALTER TYPE "SampleCheckBron" ADD VALUE IF NOT EXISTS 'steekproef';
