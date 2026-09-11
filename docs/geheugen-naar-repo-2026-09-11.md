# Wat alleen in het geheugen van Claude Code stond (controle van 11 september 2026)

Shift2Auditor moet los van Claude Code te gebruiken zijn. Daarom zijn op 11 september 2026
alle 117 geheugenbestanden van Claude Code vergeleken met wat er in deze repo staat:
CLAUDE.md, `wcag-regels/`, `wcag-checklists/`, `docs/`, de pagina Auditproces en de
workflows. Dit bestand is de werklijst van wat er nog over moet, per bestand waar het
thuishoort. Streep een punt door zodra hij in de repo staat.

## Uitkomst in getallen

| Uitkomst | Aantal |
|---|---|
| Staat volledig in de repo | 74 |
| Staat gedeeltelijk in de repo | 27 |
| Ontbreekt in de repo | 12 |
| Alleen voor een chatsessie of projectvoortgang (hoeft niet over) | 4 |

Twee van de "ontbreekt/gedeeltelijk"-gevallen zijn omgekeerd: daar liep het **geheugen**
achter op de repo. Die zijn in het geheugen gecorrigeerd; de repo is leidend.

- `title`-attribuut als enige naam: de repo (`Shift2_Regels_SC_4_1_2.md`, `Shift2_Regels_SC_2_4_4.md`)
  zegt sinds 18 augustus 2026 "beoordeel of die naam zijn werk doet", niet "altijd afkeuren".
- Telefoonnummer als linktekst: de repo zegt dat een `href` naar een **andere bestemming** wél
  een 2.4.4-afkeuring is; het geheugen zei "nooit, ongeacht href".

## Ontbreekt: over te nemen

### Auditregels (`wcag-regels/`)

1. **Lijstitem met link én toelichting is correct** → `Shift2_Regels_SC_1_3_1.md`, naast de
   één-item-lijstregel. Een `li` met een link, een regelafbreking en enkele zinnen
   toelichting is precies de goede relatie: geen bevinding, geen opmerking. "Visueel lijkt
   het een apart tekstblok" en "dit item wijkt af van de andere" zijn geen argumenten.
2. **HTML-signaal is geen zichtbaar element** → `Shift2_Bewijsvoering.md`. SPA's en
   Next.js-sites dragen markup mee voor modals en niet-gerenderde secties. Controleer eerst
   met `get-screenshot --full-page` of het onderdeel zichtbaar is; zo niet, vraag het in
   plaats van te rapporteren.
3. **PAC 2024** → nieuw `Shift2_Werkwijze_PDF.md` (zoals `Shift2_Werkwijze_Video.md`). PAC is
   de standaardtool voor PDF-toegankelijkheid, draait lokaal als Windows-app zonder API; de
   agent vraagt bij elke PDF om de uitvoer, in volgorde: Summary report, per Failed/Warning-tab
   het Detailed report, bij twijfel over leesvolgorde de Screen reader preview. Vier tabs
   (PDF/UA, WCAG, Quality, AI), vijf statussen, vijf basisvereisten als ordening. Wat PAC niet
   kan: juistheid van alt-teksten, inhoudelijke leesvolgorde, of een tag semantisch klopt.
4. **Matterhorn Protocol 1.1** → zelfde bestand. De bron van PAC's checks: 31 checkpoints, 136
   failure conditions met id's als `09-004`, ruim veertig vergen een mens. Vertaal altijd naar
   het WCAG-criterium (meestal 1.3.1, 1.3.2, 1.1.1, 4.1.2) en zet Matterhorn-id's nooit in een
   bevinding.

### Werkwijze (CLAUDE.md, Auditproces-pagina, `wcag-checklists/`)

5. **Wijzigingen beperken tot het huidige project** → `Shift2_Schrijfregels.md`. Bij een
   correctie alleen de bevinding in dit project aanpassen; de QuickFinding-bibliotheek of andere
   projecten pas na een expliciet ja per niveau.
6. **De QuickFinding-bibliotheek vullen uit een rapport** → nieuw
   `docs/werkwijze/quickfindings-uit-rapport.md`. Alleen generieke patronen, duplicaatcheck per
   los trefwoord, elk voorstel apart voorleggen en op akkoord wachten, bijwerken met PUT (een
   gedeeltelijke update zet de rest op null), verantwoordelijkheid bij twijfel vragen.
7. **Google Drive-map bij een nieuw onderzoek** → Auditproces-pagina fase 1 en CLAUDE.md. In de
   Drive-map "shift2 auditor" (id `11GekUWK6HGUvo68TTKlJvv2eQSv0zyyZ`) een submap met als naam
   uitsluitend het domein in kleine letters, bijvoorbeeld `blaricum.nl`.

### Techniek (CLAUDE.md, README.md)

8. **Findings-API gebruikt PUT** → README.md bij "API Endpoints > Findings".
   `/api/projects/<id>/findings/<findingId>` kent alleen PUT en DELETE; een PATCH geeft stil 405.
   Bevestig altijd met `-w "HTTP %{http_code}\n"`.
9. **Opmerking = `impact == null`, ongeacht status** → CLAUDE.md "Common Gotchas". Opmerkingen
   worden bewust als `resolved` opgeslagen. De rapporttab, `lib/generate-report-html.ts` en
   `lib/generate-report-docx.ts` zijn drie losse implementaties; wijzig je de tab, check dan
   beide generators. De rapporttab heet intern `?tab=findings`.
10. **User agents komen automatisch uit de geïnstalleerde browsers** → CLAUDE.md Architecture
    en Auditproces fase 7. `lib/browser-versions.ts` leest chrome/firefox/edge (alleen Windows,
    valt terug op de bestaande waarde). Nooit overnemen uit een ander project; nulmeting en
    herinspectie horen te verschillen.
11. **Word-export loopt via de HTML** → CLAUDE.md Print/PDF Export en README.md (waar DOCX nog
    als todo staat). `/api/reports/[id]/word` zet `generateReportHtml()` om via
    `lib/html-to-docx-report.ts`; rapporttekst hoort dus op één plek. Nog geen inhoudsopgave.

## Gedeeltelijk: aan te vullen

### Schrijfregels (`Shift2_Schrijfregels.md`, tenzij anders vermeld)

12. Kleurcodes in bevindingen altijd als `#RRGGBB`; technische termen introduceren als "uitleg
    in gewone taal, dan de term tussen haakjes".
13. Bij verantwoordelijkheid redacteur: opmaak adviseren via de CMS-stijl ("schuingedrukt",
    "vetgedrukt"), nooit via CSS, en niet uitleggen hoe de CMS-knoppen werken (staat nu alleen
    bij cursief in `Shift2_Regels_SC_1_3_1.md`).
14. Komt er een correctie op een bevinding, houd die dan tegen de QuickFinding en meld of de
    bibliotheek mee moet veranderen.
15. Managementsamenvatting (`Stappenplan_Shift2_Audit.md` stap 6c): geen
    toegankelijkheidsvoorzieningen als pluspunt opvoeren, geen aannames over klantgedrag, niet
    "de redactie" aanwijzen.
16. Onderzoeker-feedback (zelfde plek): positief van toon, beginnen met wat goed gaat; de
    automatisch gegenereerde tekst is meestal te kaal en moet herschreven worden.

### Auditregels (`wcag-regels/`)

17. `Shift2_Regels_SC_1_1_1.md`, onderschrift: eerst decoratief of informatief vaststellen.
    Decoratief met gevulde alt → QuickFinding `f936aa29` (onnodige alt), best practice in het
    advies. Informatief met identiek onderschrift → QuickFinding `55727449` "Dubbele tekst in
    alt-tekst en onderschrift" (klein, redacteur). Nooit "laat de alt leeg omdat het onderschrift
    de afbeelding al benoemt". Let op: `55727449` staat niet in `lib/quick-findings-data.ts`.
18. `Shift2_Regels_SC_1_1_1.md`, figure versus losse afbeelding: de motivering erbij (bij een
    losse afbeelding slaat de schermlezer het beeld over en weet de gebruiker niet dat er een
    afbeelding bij de tekst hoort) en de adviesvariant "zet de afbeelding in een figure met
    figcaption, dan kan de alt leeg".
19. `Shift2_Regels_SC_1_1_1.md`, inline base64-afbeelding: het advies (verwijderen, via de
    mediabibliotheek opnieuw plaatsen met tekstalternatief) en de oorzaak (plakken uit
    Word/Outlook slaat het alt-veld over). Bij template-monitoring geen bevinding.
20. `Shift2_Regels_SC_1_3_1.md`, niet-getagde PDF: de 1.3.1-afkeuring krijgt impact serieus en
    verantwoordelijkheid redacteur, als paar met de 1.1.1-opmerking voor hetzelfde document.
21. `Shift2_Regels_SC_1_2_3.md` en `_1_2_5.md`: de letterlijke beschrijvings- en adviesteksten
    van QuickFindings `ed3a4d2a` (1.2.3), `50baed61` (1.2.5) en `de8bf36c` (1.2.3-advies), plus
    de regel dat het 1.2.3-advies ongewijzigd blijft, ook als de zin over 1.2.5 onjuist lijkt.
22. `Shift2_Regels_SC_4_1_2.md` of `Shift2_Scope_Per_Sample.md`: hoe je een technisch issue
    aanmaakt (`POST /api/technical-issues` met title, description, request, wcagCriterionId,
    impact, supplier, status) en dat je in de beschrijving zet dat het templatecode is.

### Werkwijze en techniek

23. CLAUDE.md "Database & Prisma": `npm run backup` als eerste stap van elk plan dat de database
    raakt, controleer dat de CSV's rijen bevatten, beloof nooit "geen risico" op grond van
    documentatie; Neon Free heeft een terugdraaivenster van zes uur, dus zulk werk aan het begin
    van een dag.
24. CLAUDE.md bij curl/UTF-8: verifieer na elke mutatie met een GET op U+FFFD; fallback is JSON
    via Python met `ensure_ascii=False` en `--data-binary @bestand.json`.
25. CLAUDE.md API-overzicht en `wcag-regels/README.md`: de pagina `/technische-issues`, het
    contract van `POST /api/technical-issues`, `supplier` scheidt klantsite-issues van
    verbeterpunten aan de tool. Een kapotte `href` op een mail- of telefoonlink hoort hier, niet
    onder 2.4.4 of 4.1.2.
26. CLAUDE.md CLI-notes: `get-project` stuurt de scope-velden niet mee; lees ze van het
    projectrecord, anders lijkt de scope leeg.
27. `Stappenplan_Shift2_Audit.md` stap 4 en CLAUDE.md: bij scope en steekproef per URL vragen of
    het een sample of buiten-scope wordt; de CLI maakt geen scope-URL's aan (dat gaat via
    `POST /api/projects/<id>/scope-urls` met `inScope:false`); bij PDF's de titel vragen, bij
    pagina's zelf bepalen.
28. CLAUDE.md onder de codetoekenning: verwijs naar een bevinding altijd met het id, nooit met
    de findingCode, want `V001` wordt `B00x` bij akkoord (`lib/finding-code.ts`).
29. Nieuwe ADR in `docs/adr/`: de kaart in "Waar sta ik" is een nakijkkaart, geen auditkaart.
    Alleen melden wat mankeert; twee kleppen (criteriumuitleg, metingen van deze pagina); een
    waarneming van de onderzoeker gaat via het overleg, niet via een tekstvak.
30. Auditproces fase 7 en CLAUDE.md `save-checks`: een onderzoek kan niet op "Gereed" zolang
    ergens `niet_te_bepalen` openstaat; `niet_aanwezig` blokkeert niet.
31. `wcag-regels/README.md` of `docs/werkwijze/template-monitoring.md`: het interne project
    "Template-monitoring SIMsite" (`d8def788-4dfc-4832-9622-19dc60806382`) bundelt
    template-issues over gemeenten, één sample per gemeente als bewijs, titel
    `<Gemeente> — <Paginatitel>`, prefix `[POTENTIEEL]` voor Siteimprove, best practices als
    opmerking.
32. `wcag-checklists/Toegankelijke_Video_Maken.md` of `docs/werkwijze/video-a2-gemeenten.md`:
    de tienstapsworkflow voor de A2-gemeenten (Cranendonck, Heeze-Leende, Valkenswaard):
    downloaden via YouTube Studio, ondertiteling corrigeren in YouTube op het gemeenteaccount,
    Premiere met losgekoppeld geluid, stille momenten markeren, audiodescriptie via Narakeet of
    anders in het transcript, transcript zonder tijdcodes in een accordeon, eindcontrole
    `aria-label` "YouTube video: [onderwerp]". Ingebrande ondertiteling zonder fouten is akkoord.
33. CLAUDE.md "Welke browser": vraag vóór het ophalen of cookies, inlog en formulierstap in het
    auditsessie-venster klaarstaan; bij 401/403/timeout terugvallen op aangeleverde HTML en
    schermafdruk.
34. CLAUDE.md bij de deelgebieden: toont een mankerend gebied geen toelichting, dan is de
    `bevindingen`-koppeling van dat oordeel leeg (een opmerking valt sowieso af); repareer met
    een nieuwe audit-criterium-run, niet in de weergavecode.
35. CLAUDE.md: wijzig je projectgegevens rechtstreeks in de database, meld dan welk scherm
    ververst moet worden (de projectpagina is een servercomponent).

## Hoeft niet over

Voortgang van BEV-01, BEV-03 en UTHEU-01 staat in de database zelf. "Link plus
F5-herinnering na een CLI-actie" is chatgedrag van Claude Code.

## Uitgevoerd op 11 september 2026

Alle 35 punten hierboven zijn dezelfde dag overgenomen, per bestand zoals aangegeven. Bij
het overnemen is elk punt tegen de code gehouden; vijf keer bleek het geheugen niet (meer)
te kloppen en is de werkelijkheid opgeschreven:

- **Punt 9:** een opmerking is `type === 'opmerking'` via `isOpmerking()` in
  `lib/finding-classification.ts`; `impact == null` is alleen de terugval.
  `lib/generate-report-docx.ts` bestaat niet meer; het Word-rapport komt uit de HTML.
- **Punt 21:** QuickFinding `de8bf36c` (het vaste 1.2.3-advies) staat niet meer in de
  database. De tekst is uit `lib/quick-findings-data.ts` gehaald; als het verdwijnen
  onbedoeld is, moet hij terug in de bibliotheek.
- **Punt 29:** de twee kleppen op de kaart heten "Waar dit criterium over gaat" en "Hoe dit
  is vastgesteld"; deelgebieden gelden voor elk regelbestand met `### Deelgebieden`, dat
  zijn er negen, niet drie.
- **Punt 30:** niets in de code blokkeert "Gereed" bij een open `niet_te_bepalen`.
  `derive-assessments` berekent wel een blokkadelijst, maar Afronden kijkt er niet naar.
  Opgeschreven als werkregel (tabblad Dekking nakijken vóór afronden); een echte blokkade
  is een verbeterpunt aan de tool.
- **Punt 34:** het kale blokje toont de toelichting van een mankerend gebied juist wél als
  de bevindingenkoppeling leeg is, niet "geen toelichting" zoals hierboven staat.

Gesignaleerd maar niet gewijzigd: stap 2 op de pagina `/admin/video-a2-gemeenten` noemt
nog 4K Video Downloader, terwijl op 24 juli 2026 YouTube Studio is afgesproken.
