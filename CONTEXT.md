# Shift2 Auditor

Het uitvoeren en rapporteren van WCAG 2.2-toegankelijkheidsaudits: van het
beoordelen van een sample-pagina tot een gepubliceerd rapport.

## Language

**Akkoord**:
De handeling waarmee de onderzoeker een voorstel waar maakt: de overgang van
`voorstel` naar `open`. Een poort, geen label — zonder akkoord telt een voorstel
nergens mee, niet in de beoordeling van het criterium, niet in de statistieken,
niet in het rapport.
_Avoid_: Publiceren, goedkeuren, vrijgeven

**Waarneming**:
Een ruwe observatie van de onderzoeker: "hier klopt iets niet", zonder oordeel.
Geen criterium, geen impact, geen tekst volgens de schrijfregels — dat is juist
het werk dat er nog aan moet gebeuren. Grondstof, geen bevinding.
_Avoid_: Melding, signalering, quick note

**Voorstel**:
Een volledig uitgewerkte bevinding of opmerking die nog geen akkoord heeft:
criterium bepaald, tekst volgens de schrijfregels, impact en type ingevuld,
geverifieerd. Bestaat in de database, maar bestaat voor het rapport nog niet.
Draagt een code uit een eigen reeks (`V001`); de bevindingcode (`B001`) volgt pas
bij akkoord.
_Avoid_: Concept, suggestie, kandidaat

**Niet aanwezig**:
Het onderwerp van het criterium komt niet voor — geen video, dus geen
audiodescriptie te beoordelen. Per sample meteen vast te stellen; op
projectniveau pas als álle samples niet aanwezig zijn.
_Avoid_: Niet van toepassing, n.v.t.

**Niet te bepalen**:
Het onderwerp is er wél, maar het oordeel vergt de browser: bediening, focus,
gedrag. Geen restcategorie maar een werklijst — bij elk zo'n criterium hoort een
concrete vraag die de onderzoeker in ronde 2 beantwoordt.
_Avoid_: Onbekend, onduidelijk, twijfelgeval

**Technisch issue**:
Een gebrek dat in het sjabloon of platform zit en dus op alle pagina's tegelijk
speelt: een focusindicator die ontbreekt, een plakkende koptekst die de focus
bedekt. Gaat naar de leverancier, niet naar de redactie, en hoort daarom bij geen
enkel sample. Twintig keer als bevinding opschrijven zou onzin zijn.
_Avoid_: Bug, platformbevinding

**Dubbel criterium**:
Een succescriterium dat zowel content als techniek kan raken, en daarom in een
contentonderzoek thuishoort én een technisch issue kan opleveren. 2.1.2
(toetsenbordval) is er zo een: meestal zit die in een widget, maar een redacteur
kan er zelf een maken door iets in te sluiten.
_Avoid_: Grensgeval, gedeeld criterium

**Afwijzing**:
Het oordeel dat een voorstel geen bevinding wordt. Blijft bewaard, met de reden
erbij, zodat een volgende auditronde dezelfde onterechte vondst niet opnieuw
voorstelt.
_Avoid_: Verwerpen, weggooien, afkeuren

**Doorzetten**:
De uitgang voor een voorstel dat geen contentbevinding blijkt maar een
platformgebrek: er wordt een technisch issue aangemaakt en het voorstel wordt
afgewezen met een verwijzing daarheen. De vondst verdwijnt niet, hij verandert
van adres — van de redactie naar de leverancier.
_Avoid_: Overzetten, omzetten, escaleren

**Sampleoordeel**:
Het oordeel over één succescriterium op één sample, met de reden erbij. De
kleinste eenheid van bewijs: hieruit volgt zowel wat er goed ging als wat er nog
open staat. Draagt ook een bron — kwam dit van een agent, uit een gesprek, of van
de onderzoeker zelf — en een eigen akkoord.
_Avoid_: Testresultaat, score, check

**Criteriumoordeel**:
Het oordeel over één succescriterium in het hele onderzoek. Volgt uit de
sampleoordelen van dat criterium: `failed` bij één akkoord bevonden bevinding
waar dan ook, de overige uitkomsten zodra elk sample voor dít criterium een
definitief oordeel heeft. Hangt niet af van de vraag of die samples op andere
criteria al klaar zijn.
_Avoid_: Eindoordeel, conclusie

**Nagekeken**:
Uitspraak over volledigheid, per sample: geen enkel sampleoordeel staat nog op
"niet te bepalen" en er zijn geen openstaande voorstellen. Volgt uit de
sampleoordelen — het is geen vinkje dat de onderzoeker zelf zet.
_Avoid_: Afgerond, klaar, gecontroleerd
