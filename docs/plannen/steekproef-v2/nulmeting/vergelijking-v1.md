# Nulmeting steekproefselectie v1

Fase 0 van [Steekproefselectie v2](../). Op 2026-09-28 is de huidige workflow
`.claude/workflows/steekproef-samenstellen.js` twee keer per project gedraaid met
`drooglopen: true`, na de fix in `get-project` (planningvelden komen nu mee). Er is niets
weggeschreven. Alle runs gebruikten de auditsessie-Chrome.

| Project | Projectversie | Bestaande steekproef | Planning |
|---|---|---|---|
| LEU-01, leudal.nl | v1.1 (Gepland), `6b9673f9-…` | geen: dus een keuze vanaf nul | leeg; de URL is meegegeven |
| ZOET-01, bo.zoetermeer.nl | v1.0 (Gereed), `f4bda4cd-…` | 6 samples, destijds door v1 voorgesteld | 3 klantpagina's, waarvan 2 PDF's op een CDN |
| UTHEU-01, heuvelrug.nl | v1.0 (Gereed), `9d8d3b8c-…` | 20 samples | 1 klantpagina, 3 uitsluitingen |

Bij ZOET-01 en UTHEU-01 kreeg de keuze-agent de bestaande steekproef mee ("staat al in de
steekproef, niet nog eens aanmaken"). Dat stuurt de keuze; zie UTHEU-01 run 2.

## Bestanden

- `<kenmerk>-v1-run<n>.json`: per run de planning, de kandidatenlijst, de uitkomst per bekeken
  pagina (soort, gebieden, sjabloon), de keuze met gekozen en afgevallen pagina's, de logs en
  het gebruik.
- `<kenmerk>-referentie-bestaande-steekproef.json`: de steekproef zoals die in het project staat.
- `scripts/bewaar-run.js`, `scripts/vergelijk.js`: hiermee zijn de bestanden gemaakt en is
  deze vergelijking gegenereerd. De gebiedsnamen van de agents zijn omgezet naar de nummers uit
  de dekkingslijst; de cachebreker `?cb=` achter PDF-adressen is genegeerd.

## Samenvatting

| | LEU-01 | ZOET-01 | UTHEU-01 |
|---|---|---|---|
| Pagina's in de sitemap | 663 | 12 | 579 |
| Bekeken per run | 30 (4,5%) | 12 / 30 | 30 (5%) |
| Zelfde pagina's bekeken in beide runs | 21 van 30 | 12 | 21 van 30 |
| Gekozen | 10 / 9 | 5 / 6 | 8 / 9 |
| Overlap gekozen (Jaccard) | 7 van 12 (0,58) | 5 van 6 (0,83) | 2 van 15 (0,13) |
| Zelfde random-pagina | nee | ja | nee |
| Gedekte gebieden | 16 / 17 | 6 / 6 | 13 / 13, maar niet dezelfde |
| Pagina's met andere etiketten in run 2 | 4 van 21 | 5 van 12 | 6 van 21 |
| Tokens per run | ~3,0 mln | 1,3 / 2,9 mln | ~3,0 mln |

**Opvallend**

1. **Welke pagina's bekeken worden, is zelf al een variabele.** Leudal en Heuvelrug hebben
   ruim 570 pagina's, allemaal plat onder de root. De kandidaten-agent kiest "gespreid op
   onderwerp" 86 à 88 daarvan (steeds andere), en de workflow bekijkt er daarvan 30. Per run
   was een derde van de bekeken pagina's anders. Wat niet bekeken is, kan niet gekozen worden.
2. **Heuvelrug: vrijwel een andere steekproef.** Er zitten maar 2 pagina's in beide runs (de
   homepage en het klantformulier). Run 1 koos grofvuil, nieuws-en-meer, gemeentenieuws en de
   afvalkalender. Run 2 koos bomen-kappen, milieustraat, formulierstappen 2 en 3, en twee PDF's
   uit de bestaande steekproef, waarvan een paar niet eens in de kandidatenlijst stond
   ("staat al in de steekproef en is hier niet opnieuw bekeken").
3. **Tegenspraak over gebieden.** Heuvelrug run 1 dekt "hero met tekst eroverheen" via
   /nieuws-en-meer; run 2 zegt dat het nergens op de site staat. Dezelfde pagina's
   (/inwoners-en-bezoekers, /overlijden) kregen in run 1 "hero met tekst eroverheen" en in
   run 2 "hero zonder tekst". Run 2 vond "complex beeld" (situatieschets op /bomen-kappen);
   run 1 had die pagina niet bekeken en noemde het niet gedekt.
4. **De etiketten per pagina schuiven.** Op 15 tot 25% van de pagina's die beide runs zagen,
   verschilden de gebieden. Meestal ging het om "lijst" en "logo", soms om iets dat de keuze
   bepaalt, zoals het soort hero of een foto in de tekst.
5. **Zoetermeer: PDF's wel of niet als kandidaat.** Run 1 liet de 23 niet-aangedragen PDF's
   liggen ("ander domein"); run 2 nam ze op. De prompt zegt allebei ("alleen hetzelfde domein"
   en "neem PDF-links WEL mee"). Het gevolg in run 2: 20 van de 30 plekken om te bekijken
   gingen naar PDF's, en 5 PDF's vielen buiten de afkapping. Het eindresultaat bleef bijna
   gelijk, omdat de klant de PDF's al had aangewezen.
6. **Zoetermeer is stabiel, maar vooral door de klantpagina's en de bestaande steekproef.** Het
   enige verschil is /omgevingsprogrammas: run 1 stelt voor hem eruit te halen, run 2 kiest hem
   als representant van het overzichtssjabloon.
7. **De random-pagina** was in twee van de drie projecten per run anders, en werd steeds
   bewust gekozen ("voegt niets toe"), niet getrokken.
8. **Video:** bij geen van de drie sites gevonden. Leudal run 2 noemt zelf een mogelijke video
   in een nieuwsbericht dat niet bekeken is.
9. **Het contactformulier van Heuvelrug** gaf zonder sessie een doorverwijzingslus (302) en was
   niet gehydrateerd. Het formulier "telt" in beide runs, maar op basis van stap 1 zonder velden.
10. **`gehydrateerd` bij PDF's** vulden de agents elk anders in (soms `false`, soms `true`),
    terwijl er niets is opgehaald. Voor HTML-pagina's gaf het veld geen valse meldingen.

---

## LEU-01

| | Run 1 | Run 2 |
|---|---|---|
| Bron kandidaten | sitemap | sitemap |
| Kandidaten gevonden | 90 | 90 |
| Pagina's bekeken | 30 | 30 |
| Waarvan PDF | 0 | 0 |
| HTML niet gehydrateerd | 0 | 0 |
| Samples gekozen | 10 | 9 |
| Waarvan random | 1 | 1 |
| Agents / tokens | 33 / 3025k | 33 / 3010k |

**Kandidaten:** 65 in beide runs, 25 alleen in run 1, 25 alleen in run 2.
**Bekeken:** 21 in beide runs, 9 alleen in run 1, 9 alleen in run 2.

**Gekozen pagina's** (s = structured, r = random, p = pdf, - = niet gekozen)

| Pagina | Run 1 | Run 2 | Bestaande steekproef |
|---|---|---|---|
| /leudal/uploads/folder adreswijziging bij verblijf in een zorginstelli | p | p | - |
| /leudal/uploads/leudal_infographic_bladafval_2024.pdf | - | - | p |
| /leudal/uploads/reisdocument minderjarige, aanvraag toestemming_25.pdf | - | - | p |
| /leudal/uploads/verklaring van inwoning-bewoning leudal.pdf | p | p | - |
| / | s | s | s |
| /afspraak-in-het-gemeentehuis | s | s | s |
| /bestuur | s | - | - |
| /bladafval | - | - | s |
| /gemeentelijke-belastingen | - | s | s |
| /onroerendezaakbelasting-ozb | - | - | r |
| /openbare-ruimte-melding | s | s | s |
| /openingstijden-gemeente-leudal | s | s | - |
| /overlijden-aangifte | - | r | - |
| /paspoort-aanvragen | - | - | s |
| /sneeuwroute-1-haler-neeritter-ittervoort-hunsel-ell | - | - | s |
| /strooiroute-a-ell-hunsel-ittervoort-haler-neeritter | s | s | - |
| /uittreksel-persoonsgegevens-brp | r | - | - |
| /verhuizing-doorgeven | s | - | - |

Overlap gekozen: 7 van 12 (Jaccard 0.58).
Random-pagina: run 1 /uittreksel-persoonsgegevens-brp; run 2 /overlijden-aangifte.

**Gebieden** (dekkingslijst groep 2)

- Gedekt in run 1: 16; in run 2: 17.
- Alleen gedekt in run 1: geen.
- Alleen gedekt in run 2: 11 Foto in lopende tekst.
- Tegenspraak (de ene run dekt het, de andere zegt dat het niet op de site staat): geen.

**Etiketten per pagina:** van de 21 pagina's die beide runs bekeken, kregen er 17 in beide runs dezelfde gebieden; 4 verschillen.

| Pagina | Alleen run 1 | Alleen run 2 |
|---|---|---|
| /nieuws | - | Lijst/geneste lijst |
| /aanvragen-en-regelen-voor-inwoners | Logo | - |
| /afspraak-in-het-gemeentehuis | - | Foto in lopende tekst |
| /afvalinzameling | - | Lijst/geneste lijst |

**Toelichting van de keuze-agent**

- Run 1: leudal.nl is een SIMsite-site met veel tekst en weinig verschillende soorten inhoud. Er staan geen video's, geen audio en geen formulieren op de site zelf: die draaien allemaal extern. Acht pagina's en twee PDF's dekken alle gebieden die wel voorkomen. Uittreksel BRP is de willekeurige trekking (1 van 10, precies 10%). De twee PDF's komen van Verhuizing doorgeven: een folder en een formulier. Of dat formulier invulbaar is, blijkt pas na openen. De kaart op Strooiroute A laadt pas als de onderzoeker in de auditsessie de cookies accepteert.
- Run 2: Leudal.nl draait op één SIMsite-sjabloon. Productpagina's lijken sterk op elkaar (tekstblokken, lijsten, details-uitklapblokken, soms een kostentabel). Op de 27 bekeken pagina's staan geen video, audio, galerij, formulier of bewegende inhoud. De eis van twee video's is dus niet te halen. Mogelijk staat er één in het nieuwsbericht "Video: wethouders stellen zich voor", maar dat is niet bekeken. De steekproef telt 9 items: 7 pagina's (waarvan 1 random, 11%) en 2 PDF's van verschillende soort, een formulier en een folder, allebei van Verhuizing doorgeven. Bij Strooiroute A moeten de kaartcookies eerst geaccepteerd worden in de auditsessie-Chrome, anders is het iframe niet te beoordelen.

## ZOET-01

| | Run 1 | Run 2 |
|---|---|---|
| Bron kandidaten | sitemap | sitemap |
| Kandidaten gevonden | 12 | 35 |
| Pagina's bekeken | 12 | 30 |
| Waarvan PDF | 2 | 20 |
| HTML niet gehydrateerd | 0 | 0 |
| Samples gekozen | 5 | 6 |
| Waarvan random | 1 | 1 |
| Agents / tokens | 15 / 1347k | 33 / 2863k |

**Kandidaten:** 12 in beide runs, 0 alleen in run 1, 22 alleen in run 2.
**Bekeken:** 12 in beide runs, 0 alleen in run 1, 17 alleen in run 2.

**Gekozen pagina's** (s = structured, r = random, p = pdf, - = niet gekozen)

| Pagina | Run 1 | Run 2 | Bestaande steekproef |
|---|---|---|---|
| / | s | s | s |
| /omgevingsprogrammas | - | s | r |
| /ontwerp-wijzigingsbesluit-omgevingsplan-gemeente-zoetermeer-eerste-fa | s | s | s |
| /wat-is-bo | r | r | s |
| /bozoetermeer4c6091/uploads/bijlage 2 - motivering van het ‘ontwerp wi | p | p | p |
| /bozoetermeer4c6091/uploads/collegebesluit ontwerp wijzigingsbesluit o | p | p | p |

Overlap gekozen: 5 van 6 (Jaccard 0.83).
Random-pagina: run 1 /wat-is-bo; run 2 /wat-is-bo.

**Gebieden** (dekkingslijst groep 2)

- Gedekt in run 1: 6; in run 2: 6.
- Alleen gedekt in run 1: geen.
- Alleen gedekt in run 2: geen.
- Tegenspraak (de ene run dekt het, de andere zegt dat het niet op de site staat): geen.

**Etiketten per pagina:** van de 12 pagina's die beide runs bekeken, kregen er 7 in beide runs dezelfde gebieden; 5 verschillen.

| Pagina | Alleen run 1 | Alleen run 2 |
|---|---|---|
| / | Lijst/geneste lijst | - |
| /volkshuisvestingsprogramma | - | Logo, Iconen zonder tekst |
| /wat-is-bo | Logo | - |
| /omgevingsvisie | - | Logo, Iconen zonder tekst |
| /omgevingsplan | Logo, Iconen zonder tekst | - |

**Toelichting van de keuze-agent**

- Run 1: bo.zoetermeer.nl is een kleine bekendmakingssite op SIMsite. Er zijn maar twee soorten pagina's: overzichten met kaartjes zonder afbeelding, en documentenpagina's met lijsten van PDF-links. Er staan geen video's, tabellen, formulieren, uitklapblokken of foto's in de inhoud. Daarom volstaat een steekproef van vijf items: de homepage, de door de klant aangedragen bekendmaking met haar twee PDF's (een besluit en een nota) en 'Wat is BO?' als willekeurige pagina (1 van 5, 20%). Er is nog één ding te doen: 'Omgevingsprogramma's' staat al in de steekproef maar voegt niets toe. Of die pagina eruit gaat, beslist de onderzoeker.
- Run 2: bo.zoetermeer.nl is een kleine SIMsite-site met drie sjablonen: de homepage, overzichten met kaartjes (titel + datum) en documentenpagina's met lijsten PDF-links. Alle zes gekozen samples staan al in de steekproef, dus er hoeft niets nieuw aangemaakt te worden. Wel wordt Wat is BO? nu als random aangemerkt. De site heeft geen video's, tabellen, formulieren, accordeons of ingesloten kaders. Aan de PDF-eis is voldaan met een collegebesluit tegenover een nota (motivering). Een invulbaar PDF-formulier is niet gevonden.

## UTHEU-01

| | Run 1 | Run 2 |
|---|---|---|
| Bron kandidaten | sitemap | sitemap |
| Kandidaten gevonden | 90 | 90 |
| Pagina's bekeken | 30 | 30 |
| Waarvan PDF | 1 | 0 |
| HTML niet gehydrateerd | 1 | 1 |
| Samples gekozen | 8 | 9 |
| Waarvan random | 1 | 1 |
| Agents / tokens | 33 / 3010k | 33 / 3010k |

**Kandidaten:** 68 in beide runs, 22 alleen in run 1, 22 alleen in run 2.
**Bekeken:** 21 in beide runs, 9 alleen in run 1, 9 alleen in run 2.

**Gekozen pagina's** (s = structured, r = random, p = pdf, - = niet gekozen)

| Pagina | Run 1 | Run 2 | Bestaande steekproef |
|---|---|---|---|
| /heuvelrug/uploads/afvalkalender_doorn_2026_0.pdf | p | - | - |
| /heuvelrug/uploads/beleidsvisie_horeca_en_terrassen.pdf | - | p | p |
| /heuvelrug/uploads/gemeente heuvelrug wk39-2026.pdf | p | - | - |
| /heuvelrug/uploads/gemeentenieuws week 30 - 23 juli 2026.pdf | - | p | p |
| / | s | s | s |
| /afvalapp-en-afvalkalender | - | - | s |
| /afvalstoffenheffing-en-regelgeving | - | - | s |
| /allround-boomverzorger | - | - | s |
| /archeologie | - | - | r |
| /begraafplaats-doorn | r | - | - |
| /bomen-kappen | - | s | s |
| /buitenspelen | - | - | s |
| /contact | - | - | s |
| /form/contactformulier/contactformulier-0 | s | s | s |
| /form/contactformulier/overzicht-2 | - | s | s |
| /form/contactformulier/stap-0-8-1 | - | s | s |
| /geen-geothermie-in-onze-gemeente | - | - | s |
| /gemeentenieuws | s | - | - |
| /grofvuil | s | - | - |
| /japanseduizendknoop | - | - | s |
| /lokale-inclusie-en-vanzelfsprekend-meedoen | - | - | r |
| /milieu-en-duurzaamheid | - | - | s |
| /milieustraat | - | s | - |
| /nieuws-en-meer | s | - | s |
| /paspoort | - | - | s |
| /verhuizing-doorgeven | - | r | - |
| /werken-bij-de-gemeente | - | - | s |

Overlap gekozen: 2 van 15 (Jaccard 0.13).
Random-pagina: run 1 /begraafplaats-doorn; run 2 /verhuizing-doorgeven.

**Gebieden** (dekkingslijst groep 2)

- Gedekt in run 1: 13; in run 2: 13.
- Alleen gedekt in run 1: 4 Hero met tekst eroverheen.
- Alleen gedekt in run 2: 8 Complex beeld.
- Tegenspraak (de ene run dekt het, de andere zegt dat het niet op de site staat): 4 Hero met tekst eroverheen.

**Etiketten per pagina:** van de 21 pagina's die beide runs bekeken, kregen er 15 in beide runs dezelfde gebieden; 6 verschillen.

| Pagina | Alleen run 1 | Alleen run 2 |
|---|---|---|
| / | - | Lijst/geneste lijst |
| /inwoners-en-bezoekers | Hero met tekst eroverheen | Hero zonder tekst, Lijst/geneste lijst |
| /over-de-gemeente | Lijst/geneste lijst | - |
| /contact | - | Lijst/geneste lijst |
| /burgerzaken | Lijst/geneste lijst | Logo |
| /overlijden | Hero met tekst eroverheen | Hero zonder tekst |

**Toelichting van de keuze-agent**

- Run 1: heuvelrug.nl draait bijna helemaal op twee SIMsite-sjablonen: overzichtspagina's met een hero naast de kop en tegels zonder afbeelding, en informatiepagina's met tekst, lijsten en soms een uitklapblok. Daarom dekken 5 pagina's en 2 PDF's alles wat er te vinden is. Er zijn geen video's, dus de eis van twee video's kan niet worden gehaald. Van het contactformulier is alleen stap 1 gezien: die heeft geen velden en de JavaScript draaide niet. Neem de volgende stappen daarom als losse samples op na een doorloop in de auditsessie. De aanvraagportalen op iburgerzaken.heuvelrug.nl en heuvelrug.mijnafspraakmaken.nl zijn eigen sjablonen buiten dit domein. Of ze in scope vallen, beslist de onderzoeker.
- Run 2: heuvelrug.nl draait bijna helemaal op één SIMsite-sjabloon. Er zijn veel overzichtspagina's met een hero en tekstkaartjes, en informatiepagina's met uitklapblokken. Video, audio, iframes, galerijen en anderstalige inhoud zijn niet gevonden, dus de harde eis van twee video's kan de site niet invullen. De voorgestelde steekproef telt 9 items (1 random, 11%): homepage, /bomen-kappen (die zes gebieden tegelijk dekt), /milieustraat voor de geneste lijst, de drie stappen van het aangedragen contactformulier en twee PDF's van verschillende soort die al in de steekproef stonden. De overige pagina's die al in de steekproef staan (nieuws-en-meer, archeologie, Japanseduizendknoop en andere) zijn hier niet bekeken. Of die blijven, beslist de onderzoeker.
