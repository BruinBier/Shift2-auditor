# Steekproefselectie v2: besluiten

Besluiten van de onderzoeker die het ontwerp sturen. Nieuwste onderaan. Elk besluit
noemt de fase waarin het geldt.

## 2026-09-28, na fase 1

### Een uitsluitregel met query raakt alleen die variant (fase 1, doorgevoerd)

Een regel uit "Buiten scope" werkt op het pad, tenzij hij zelf een query bevat. Dan sluit
hij precies die variant uit en niets anders. `https://heuvelrug.mijnafspraakmaken.nl/&?product=306`
sluit dus product 306 uit, niet de andere producten.

Waarom: zo kan de onderzoeker later heel precies uitsluiten, zonder per ongeluk alle
varianten van een pagina weg te gooien. Tot deze wijziging sloot die ene regel bij
UTHEU-01 28 producten uit.

Doorgevoerd in `lib/steekproef/urls.ts` (`uitsluitregel`, `uitgeslotenDoor`), met test.
`INVENTARIS_VERSIE` is 2; een inventarisatie van versie 1 is daardoor niet één-op-één
vergelijkbaar met een van versie 2.

### Profileren hangt niet af van een statische video-aanwijzing (fase 2, nog te bouwen)

De statische aanwijzingen uit fase 1 zien geen video's, kaarten en kaders die pas met
JavaScript of na een cookiekeuze laden. Op alle drie de testsites stond "video 0" en
"iframe 0". Als alleen pagina's met een statische aanwijzing een profiel in de browser
krijgen, houdt die beperking zichzelf in stand.

Daarom geldt in fase 2:

1. Een pagina komt ook voor een profiel in aanmerking op grond van andere kenmerken:
   veel documentlinks, een onbekend iframe, een formulier, of een ander bijzonder kenmerk
   uit de inventarisatie.
2. Een vast deel van het profielbudget wordt **gespreid over de overige pagina's** gekozen
   (met een seed, zodat het reproduceerbaar is), juist om te vinden wat Cheerio niet ziet.
3. Hoe groot dat deel is, staat in de configuratie en in de vastlegging van elke run.

### Het profielbudget van 40 is een testwaarde, geen norm (fase 2)

40 is gekozen om fase 2 te kunnen testen, niet omdat het genoeg is. Blijkt in fase 2 dat
de gespreide keuze belangrijke onderdelen mist (bijvoorbeeld bij Leudal, met 715
HTML-kandidaten), dan is de eerste vraag niet "hoeveel meer", maar of de manier van
kiezen slimmer kan. Denk aan: spreiden over URL-patronen en paginasoorten in plaats van
puur willekeurig, of de pagina's kiezen waarvan de inventarisatie het minst weet.

Een hoger budget is pas aan de orde als een betere keuze aantoonbaar niet genoeg helpt.
Het budget en de keuzemethode worden per run vastgelegd, zodat runs met een andere
instelling niet ongemerkt naast elkaar worden gelegd.

## 2026-09-28, fase 2a

### Meegestuurde paginadata is een aanwijzing, geen bewijs (doorgevoerd)

De inventarisatie leest `script#__NEXT_DATA__` (alleen `pageProps.contentDetails`, de inhoud
van de pagina zelf) en schema.org-`VideoObject`. Alleen specifieke aanwijzingen tellen: een
embed-URL (YouTube, Vimeo, Blue Billywig, JW Player, kaartdiensten), iframe-HTML, of een
componentnaam uit een vaste lijst (`ParagraphDynamicMap`, `ParagraphVideo`, ...). Nooit losse
woorden. Een iframe die zelf een video of kaart is, telt alleen als video of kaart.

Dit stuurt alleen de profielkeuze (nieuwe reden `KAART_AANWIJZING`). De browsermeting blijft
leidend: op 28 september bevestigde die alle 52 aangemerkte pagina's.

## 2026-09-28, fase 3 (schaduw)

### Sjabloonclusters: opbouw, geen inhoud (doorgevoerd, zonder invloed op de steekproef)

- De vingerafdruk (versie 1, opgeslagen per kandidaat) bestaat uit CMS-data (inhoudstype,
  componenten in volgorde, of structurele velden gevuld zijn), de DOM-opbouw van main en de
  sjabloonkoppen. Geen tekst, geen video-id's.
- De binnenkant van een redactioneel tekstveld telt niet: koppen, lijsten, tabellen en een
  ingesloten video daarin zijn inhoud. Een video in de lopende tekst maakt dus geen ander
  sjabloon; een eigen videocomponent (`ParagraphVideo`) wel.
- Complete linkage, zodat een keten van net-gelijke pagina's geen cluster wordt: een
  onterechte samenvoeging is riskanter dan een onterechte splitsing.
- Een vingerafdruk van een andere versie wordt geweigerd, niet met nieuwe logica gelezen.

## Bekende problemen, bewust niet tussendoor opgelost

- **`get-project` geeft altijd een lege lijst `scopeUrls`.** `GET /api/projects/[id]/scope-urls`
  bestaat niet (405). Geregistreerd als technisch issue voor `shift2-auditor` op
  `/technische-issues` (id `d58d0f2d-5648-4f6f-a564-ee258cd4a86e`), 2026-09-28. De
  inventarisatie heeft er geen last van: die leest de scope-URL's via Prisma.
