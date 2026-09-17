-- Zit er een tagstructuur in dit PDF-document? Vastgesteld bij de steekproef.
--
-- Anders dan heeft_bewegend_beeld en heeft_formulier sluit dit GEEN criteria af: het
-- stuurt de route. Zonder tags bestaat er voor hulpsoftware geen structuur om te
-- toetsen en vervalt een reeks criteria via Shift2_Regels_SC_1_3_1.md; met tags gaat
-- het juist om de kwaliteit ervan, en daar komt PAC bij. Daarom staat dit veld niet in
-- PAGINAVINKJES: false mag hier nooit "niet van toepassing" gaan betekenen.
--
-- De vraag is alleen of de tagboom er is (/StructTreeRoot), niet of het document
-- zichzelf als Tagged PDF markeert (/MarkInfo /Marked). Die twee kunnen uit elkaar
-- lopen; een uitstaande /Marked is een bevinding onder 1.3.1, geen routekeuze.
--
-- Nullable ZONDER default: NULL betekent "niet vastgesteld". Bestaande rijen krijgen
-- NULL en er verandert niets aan lopend werk.

ALTER TABLE "sample_items" ADD COLUMN "heeft_tags" BOOLEAN;
