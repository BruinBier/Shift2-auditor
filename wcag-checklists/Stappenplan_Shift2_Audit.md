# Stappenplan Shift2 Website Audit

Werkwijze voor een WCAG-audit in de Shift2-auditor tool. Per stap staat beschreven welke input van de gebruiker komt, welke actie Claude in de tool uitvoert, en wat het resultaat is.

## Hoe gebruik je dit stappenplan

Dit is een generiek draaiboek, niet gebonden aan één specifiek project.

**Voor een nieuw project:**
1. Zeg tegen Claude: "we gaan een nieuw project doen, volg het stappenplan"
2. Claude opent dit bestand en doorloopt de stappen één voor één
3. Per stap vraagt Claude de benodigde input en voert de actie uit in de tool
4. Het stappenplan zelf blijft ongewijzigd — alleen de Shift2-database vult zich met projectdata

**Onderhoud van dit bestand:**
- Voeg pas een stap toe of pas een stap aan als de werkwijze structureel verandert
- Hou het generiek: geen project-specifieke namen, kenmerken of URL's in dit bestand

---

## Stap 1 — Project openen of aanmaken

**Input van gebruiker:**
- Project-URL of project-ID (als het project al bestaat), of
- Projectgegevens (naam, opdrachtgever, type onderzoek, domein) als het nog niet bestaat

**Actie in de tool:**
- Bij bestaand project: `npm run cli -- get-project <id>` om te zien wat er al in zit (scope, samples, findings, assessments)
- Bij leeg of nieuw project: bevestigen dat we hiermee doorwerken; niet verwijderen tenzij gebruiker dat expliciet vraagt
- Kenmerk, titel, researchType en level noteren

**Resultaat:**
- Project-ID bekend voor vervolgstappen
- Duidelijk welke onderdelen nog leeg zijn en in welke volgorde we ze gaan vullen

---

## Stap 2 — Binnen-scope URL's vastleggen

**Input van gebruiker:**
- De basis-URL(s) die binnen de scope vallen (meestal het hoofddomein, bv. de homepage van de gemeente)

**Actie in de tool:**
- Per URL een `ProjectScopeUrl` aanmaken met `inScope: true` via:
  ```bash
  curl -s -X POST http://localhost:3000/api/projects/<projectId>/scope-urls \
    -H "Content-Type: application/json; charset=utf-8" \
    --data-binary @- <<'EOF'
  {"url":"<URL>","inScope":true}
  EOF
  ```
- De titel wordt automatisch opgehaald uit de `<title>` van de pagina; hoeft niet meegegeven te worden
- Bevestig per URL dat hij is toegevoegd (toon het terug-gegeven id en de opgehaalde titel)

**Resultaat:**
- Binnen-scope URL's staan in de tool en verschijnen in het Scope-tabblad onder "binnen de scope"

---

## Stap 3 — Buiten-scope URL's en overige scope-informatie vastleggen

**Input van gebruiker:**
- Eén of meer URL's die buiten de scope vallen (bv. extern raadsinformatiesysteem, externe booking-/betaal-widgets, subdomeinen die niet onder dit onderzoek vallen)
- De lijst is niet definitief: gedurende het onderzoek kunnen er meer bijkomen — telkens wanneer de gebruiker een extra out-of-scope URL doorgeeft, voeg ik die op dezelfde manier toe
- "Overige scope-informatie": vrije tekst met generieke uitzonderingen die niet aan één URL hangen (bv. de wettelijke uitzonderingen voor de overheid: kaarten, oude kantoorbestanden, live video's, content van derden, archieven, content achter inlog). Dit blok komt standaard mee bij research type "WCAG 2.2 AA deelonderzoek content website"; bij andere typen of bij afwijkingen vraagt Claude expliciet welke tekst hier moet komen.

**Actie in de tool:**
- Per buiten-scope URL: `ProjectScopeUrl` aanmaken met `inScope: false` via hetzelfde endpoint als stap 2, maar dan met `"inScope":false`
- Overige scope-informatie opslaan op het project in het veld `scopeInfo` (markdown bullet-lijst):
  ```bash
  curl -s -X PATCH http://localhost:3000/api/projects/<projectId> \
    -H "Content-Type: application/json; charset=utf-8" \
    --data-binary @- <<'EOF'
  {"scopeInfo":"- Niet de online kaarten en karteringsdiensten, tenzij ze bedoeld zijn voor navigatie (wettelijke uitzondering voor de overheid)\n- Niet de kantoorbestanden van vóór 23 september 2018, tenzij ze deel uitmaken van een administratief proces (wettelijke uitzondering voor de overheid).\n- Niet de live video's (wettelijke uitzondering voor de overheid)\n- Niet de audio- en videobestanden die vóór 23 september 2020 op het digitale kanaal zijn geplaatst (wettelijke uitzondering voor de overheid)\n- Niet de van derden afkomstige inhoud (wettelijke uitzondering voor de overheid)\n- Niet de inhoud van archieven (wettelijke uitzondering voor de overheid)\n- Niet de inhoud achter een inlog"}
  EOF
  ```
- Bevestig per URL dat hij is toegevoegd en bevestig dat `scopeInfo` is opgeslagen

**Resultaat:**
- Buiten-scope URL's staan in de tool en verschijnen in het Scope-tabblad onder "buiten de scope"
- Overige scope-informatie staat in het Scope-tabblad onder "Overige scope informatie"
- Deze URL's en uitzonderingen worden niet meegenomen in steekproef of bevindingen

---

## Stap 4 — Steekproef vastleggen (SampleItems)

**Input van gebruiker:**
- Lijst van pagina's en documenten die de steekproef vormen. Per item:
  - URL (bij PDF de directe link naar het document; mag in theorie leeg zijn voor offline PDF)
  - Titel of korte aanduiding (mag uit context worden afgeleid als de gebruiker alleen URL's geeft)
- Een meerstapsformulier (bv. invoer → gegevens → controleren → bevestiging) wordt opgegeven als losse stappen; iedere stap is een eigen SampleItem
- De steekproef is niet definitief: gedurende het onderzoek kunnen er pagina's bijkomen — telkens wanneer de gebruiker een extra pagina of document doorgeeft, maak ik er een nieuw SampleItem voor aan op dezelfde manier

**Actie in de tool:**
- Per item één SampleItem aanmaken met `npm run cli -- create-sample-item <projectId> --title="..." --url=... --type=...`
- Type bepalen:
  - `pdf` voor `.pdf`-URL's
  - `structured` voor gekozen HTML-pagina's (homepage, contact, productpagina's, formulierstappen)
  - `random` voor willekeurig getrokken pagina's (zie hieronder)
- **Random-eis (10%-regel):** elk onderzoek moet minimaal 10% van de steekproef als `random` bevatten.
  - Claude **vraagt actief** om random pagina's zodra de structured/pdf-lijst binnen is — niet wachten tot de gebruiker het uit zichzelf aangeeft
  - De tool rekent met `Math.round((random / totaal) * 100) >= 10`. Dus vanaf een werkelijk percentage van **9,5%** wordt de melding groen (`Math.round(9.5) = 10`); daaronder geel
  - Praktisch: bij ~20 items zijn 2 random pagina's voldoende (2/20 = 10%, 2/21 = 9,52% → afgerond 10), bij grotere steekproeven opnieuw rekenen
  - **Concrete vraag aan de gebruiker:** Claude berekent zelf hoeveel random pagina's nodig zijn op basis van het totaal, en zegt dat concreet — bv. "Geef me 2 pagina's uit de steekproef die ik op willekeurig moet zetten" (of "geef me 2 extra willekeurige URL's"). De gebruiker hoeft niet zelf te rekenen; hij kiest alleen wélke pagina's het worden (Claude kiest ze niet zelf)
  - De random-pagina's kunnen op twee manieren in de tool komen:
    - **(a)** Bestaand `structured` item omzetten naar `random` (UI: dropdown bij item; via API: `PATCH /api/projects/<projectId>/sample-items/<sampleId>` met `{"sampleType":"random"}`)
    - **(b)** Nieuw item aanmaken met `--type=random` (alleen als de gebruiker een URL geeft die nog niet in de steekproef zit)
  - Tel na elke uitbreiding van de steekproef opnieuw; zakt het werkelijke percentage onder 9,5%, dan vraagt Claude direct om extra random pagina's
- Bij formulierstappen: titel prefixen met "Contactformulier stap N - ..." (of vergelijkbaar) zodat de volgorde duidelijk blijft in de UI
- Onafhankelijke create-calls parallel uitvoeren — scheelt veel tijd bij grote steekproeven
- **Volgorde in de steekproef (verplicht):**
  1. Homepage altijd bovenaan
  2. Daarna de overige structured pagina's, met random pagina's daartussen (geen aparte plek voor random)
  3. Daarna eventuele formulier-stappen, in de juiste stapvolgorde (stap 1 → 2 → 3 → ...)
  4. PDF-documenten onderaan
  - De volgorde wordt vastgelegd via het `orderIndex`-veld op SampleItem. Claude past dit aan zodra de samenstelling van de steekproef stabiel is (of na elke uitbreiding)
- Verzamel de teruggegeven `id`-waarden; die zijn later nodig om bevindingen aan sample-items te koppelen

**Resultaat:**
- Alle pagina's en documenten van de steekproef staan als SampleItem in het project
- SampleItem-ID's zijn beschikbaar voor het koppelen van bevindingen (`--sample-items=...`)

---

## Stap 5 — Bevindingen verzamelen per pagina

We doorlopen de steekproef in de volgorde uit Stap 4 (homepage eerst, dan structured/random door elkaar, dan formulieren, dan PDF's). Per pagina checkt Claude de WCAG-criteria die voor het researchtype van toepassing zijn; de specifieke criteria-lijst en de inputs per pagina-type worden in losse substappen vastgelegd.

### Stap 5a — Eerste pagina: de homepage

**Input van gebruiker (Claude vraagt expliciet):**
- Een **screenshot van de volledige homepage** (boven én onder de vouw, geen alleen-zichtbare-deel screenshot)
- De **outerHTML** van de pagina (volledige DOM zoals na rendering — niet alleen de server-HTML)

**Waarom volledig (en niet alleen `<main>`):**
- Op de homepage worden ook structuur-elementen beoordeeld die buiten `<main>` staan: header, hoofdnavigatie, **footer**, skip-links, landmarks
- De footer is meestal op elke pagina identiek; door hem hier volledig te beoordelen hoeven we hem bij latere pagina's niet opnieuw te checken
- Bij latere pagina's wordt in een aparte substap besproken welke inputs nodig zijn (vaak alleen `<main>`, zonder header en footer)

**Te checken WCAG-criteria (deelonderzoek content, 30 SC's):**

| SC | Naam |
|---|---|
| 1.1.1 | Niet-tekstuele content |
| 1.2.1 | Louter-geluid en louter-videobeeld (vooraf opgenomen) |
| 1.2.2 | Ondertitels voor doven en slechthorenden (vooraf opgenomen) |
| 1.2.3 | Audiodescriptie of media-alternatief (vooraf opgenomen) |
| 1.2.4 | Ondertitels voor doven en slechthorenden (live) |
| 1.2.5 | Audiodescriptie (vooraf opgenomen) |
| 1.3.1 | Info en relaties |
| 1.3.2 | Betekenisvolle volgorde |
| 1.3.3 | Zintuiglijke eigenschappen |
| 1.3.5 | Identificeer het doel van de input |
| 1.4.1 | Gebruik van kleur |
| 1.4.2 | Geluidsbediening |
| 1.4.3 | Contrast (minimum) |
| 1.4.5 | Afbeeldingen van tekst |
| 1.4.10 | Reflow |
| 1.4.11 | Contrast van niet-tekstuele content |
| 2.1.2 | Geen toetsenbordval |
| 2.1.4 | Enkel teken sneltoetsen |
| 2.2.2 | Pauzeren, stoppen of verbergen |
| 2.3.1 | Drie flitsen of beneden drempelwaarde |
| 2.4.2 | Paginatitel |
| 2.4.4 | Linkdoel (in context) |
| 2.4.6 | Koppen en labels |
| 2.5.3 | Label in naam |
| 2.5.8 | Grootte van het aanwijsgebied (minimum) |
| 3.1.1 | Taal van de pagina |
| 3.1.2 | Taal van onderdelen |
| 3.2.4 | Consistente identificatie |
| 3.3.2 | Labels of instructies |
| 4.1.2 | Naam, rol en waarde |

**Actie van Claude:**
- Pas met de check beginnen wanneer beide inputs binnen zijn — niet zelf de pagina ophalen
- Loop de criteria in deze tabel één voor één na voor de hele pagina, inclusief header, hoofdnavigatie, hoofdinhoud én footer
- Per criterium beoordelen tegen de regels uit `wcag-checklists/Checklist_SC_X_X_X.md` en de memory-feedback (jargon, vorm, lengte, etc.)
- **Hergebruik vóór zelf formuleren — vaste volgorde per geconstateerd issue:**
  1. **QuickFindings (snelle bevindingen)** eerst raadplegen — dit is de centrale bibliotheek met hergebruikbare templates op `/admin/bevindingen`. Via CLI: `npm run cli -- search-quick-findings <keyword>` (per SC of trefwoord). Als er een passende QuickFinding is, gebruik `create-finding-from-quick` (memory-regel "Eerst QuickFinding-bibliotheek checken")
  2. **Findings in andere Shift2-projecten** — als geen QuickFinding past, kijken hoe vergelijkbare issues elders zijn geformuleerd. Alle projecten zijn relevant, ongeacht researchType (ook PDF-only en formulier-onderzoeken). Doel: terugkerende gemeente-issues niet missen (cookiebanner, accessibility-overlays, vergelijkbare CMS-templates), schrijfstijl consistent houden, en bestaande formuleringen hergebruiken. Praktisch: `npm run cli -- list-projects` en per project `get-project <id>`
  3. **Zelf formuleren** — alleen als hergebruik niet mogelijk is. Volg de schrijfregels uit de memory-feedback (Cardan-stijl, geen URL in description, geen em-dash, geen technisch jargon, kort en to-the-point, etc.)
- **Concept-review vóór wegschrijven (verplicht):** Claude schrijft bevindingen **niet** direct weg naar de tool. Per bevinding eerst een concept tonen in chat met: SC, description, advice, impact, responsibility, status, gekoppelde sample-items. De gebruiker geeft akkoord of vraagt aanpassing (formulering, splitsen, samenvoegen, schrappen). Pas na akkoord uitvoeren via `create-finding` of `create-finding-from-quick`. Reviewmodus: **per bevinding** (één tegelijk), niet in batches per criterium of per pagina — fijnmazige controle weegt zwaarder dan snelheid

**Resultaat:**
- Homepage volledig nagelopen (inclusief footer — voor alle volgende pagina's hoeft de footer niet meer opnieuw)
- Bevindingen aangemaakt en gekoppeld aan het Homepage-SampleItem
- Klaar om door te gaan naar de tweede pagina

### Stap 5b — Volgende pagina's (na de homepage)

**Input van gebruiker (Claude vraagt per pagina expliciet):**
- Een **screenshot van de pagina** (volledige pagina, inclusief alles wat zichtbaar wordt na scrollen)
- De **outerHTML van het `<main>`-element** (dus zonder header, hoofdnavigatie en footer — die zijn al in stap 5a beoordeeld)

**Te checken WCAG-criteria:**
Dezelfde lijst als stap 5a, met de volgende uitzonderingen die op de homepage al zijn afgehandeld en niet meer per pagina worden gecheckt:
- **1.4.3 Contrast (minimum)** — alleen checken bij PDF-pagina's; bij formulier-pagina's vragen of de hoogcontrast-knop op die pagina voldoende contrast heeft (zie [[feedback_1_4_3_contrast_switch_workflow]])
- **1.4.11 Contrast van niet-tekstuele content** — idem als 1.4.3
- **1.4.10 Reflow** — per pagina actief aan gebruiker vragen om 320px-check (zie [[feedback_1_4_10_reflow_ask_per_page]])
- **2.1.2 Geen toetsenbordval** — per pagina actief aan gebruiker vragen om Tab-test (zie [[feedback_2_1_2_keyboard_trap_ask_per_page]])

De footer wordt niet opnieuw beoordeeld — die is al volledig gechecked in stap 5a.

**Actie van Claude:**
- Pas met de check beginnen wanneer beide inputs binnen zijn — niet zelf de pagina ophalen
- Loop dezelfde criteria-tabel als in stap 5a na, met de hierboven genoemde uitzonderingen
- Volg de "Hergebruik vóór zelf formuleren"-volgorde uit stap 5a (QuickFindings → andere projecten → zelf formuleren)
- Bij issues die al op de homepage zijn gevonden (bv. social-media-lijst in footer): geen nieuwe bevinding aanmaken — die is al gekoppeld aan het Homepage-sample-item. Pas alleen het bestaande sample-item-koppelingenlijstje uit als hetzelfde issue zich ook op deze pagina voordoet (zie [[feedback_merge_repeat_issues]])
- **Concept-review per bevinding** blijft van kracht: niet direct wegschrijven

**Resultaat:**
- Pagina volledig nagelopen op de van toepassing zijnde SC's
- Bevindingen aangemaakt of bestaande bevindingen uitgebreid met deze pagina
- Klaar om door te gaan naar de volgende pagina

---

## Stap 6 — Rapportage afronden (automatisch na laatste pagina)

Zodra de laatste pagina van de steekproef is gecheckt, gaat Claude **automatisch** door met deze afrondende stappen. Niet stoppen na de bevindingen-fase en wachten op verzoek — dit is onderdeel van de standaardworkflow. De volgorde is strikt:

### Stap 6a — Assessment-statussen controleren

**Eerst** alle WCAG-criterium-assessments nalopen, vóór de management-samenvatting. Bij het wegschrijven van een open bevinding zet de tool het criterium automatisch op `failed`, maar dat is geen volledige controle:
- Criteria zónder bevinding staan vaak op `not_present` of nog op niets — moeten naar `passed` als ze daadwerkelijk getoetst zijn
- Opmerkingen (status `resolved`) leiden niet automatisch tot `failed`; de assessment moet handmatig op de juiste status
- Sommige criteria zijn `not_present` (geen audio/video aanwezig, geen flits-content, geen formulier op niet-formulier-pagina's) en moeten dat ook blijven

**Actie van Claude:**
- Haal alle assessments op via een Prisma-query of via `get-project` en de bijbehorende endpoint
- Maak een overzicht van alle 30 SC's (of het aantal van het researchtype) met huidige status en koppeling aan eventuele bevindingen
- Markeer welke statussen mogelijk niet kloppen (bv. `not_present` waar wel iets is getoetst, `failed` zonder bevinding, lege status)
- Leg het overzicht aan de gebruiker voor; vraag expliciet om de statussen handmatig bij te werken of, indien gewenst, op te geven welke wijzigingen Claude moet doen via `set-assessment`
- Wacht op bevestiging dat alle statussen kloppen vóór door te gaan met stap 6b

### Stap 6b — Onderzoeker-feedback schrijven (verschijnt op tabblad Conclusie)

**Wat het is:** een uitgeschreven tekst die op het Conclusie-tabblad als "Feedback van onderzoeker" verschijnt. Dit is in de praktijk **de samenvatting voor de opdrachtgever**: wat ging goed en wat kan beter, in lekentaal. Komt in het veld `researcherFeedback` op het project (let op: niet `researcherFeedbackText` — dat veld is een ander oud veld).

**Schrijfregels (zie [[feedback_management_summary_style]]):**
- Leek-taal, geen SC-codes (niet "1.3.1", maar "structuur van de pagina")
- Geen jargon (geen "ARIA", "DOM"); "hulpsoftware" mag, want dat gebruiken de andere projecten ook
- Korte zinnen
- Geen gedachtestreepjes (geen — of –)
- "PDF-documenten" (niet "PDFs")
- HTML met `<p>`-tags, twee korte alinea's (~500-900 tekens totaal). Eerste alinea = wat gaat goed, tweede alinea = wat kan beter. PDF-issues als afsluiting van de tweede alinea
- Vergelijk de stijl met BEL-01 t/m BEL-04, GRJW-01, Heerlen-01 (allemaal status Gereed)

**Actie van Claude:**
- Eerste concept zelf schrijven op basis van de bevindingen
- Concept aan gebruiker voorleggen voor akkoord en aanpassingen
- Pas na akkoord opslaan via `PATCH /api/projects/<id>` met `{"researcherFeedback": "<p>...</p><p>...</p>"}`

**Niet invullen:**
- `managementSummary` blijft leeg (consistent met de meeste Gereed-projecten). Alleen URK-01 heeft dit veld gevuld met een procedurele tekst over de scope; dat is een uitzondering en bij een gewoon deelonderzoek content niet nodig.

### Stap 6c — Project finaliseren

Pas na akkoord op samenvatting en feedback:
- Vraag aan gebruiker of het project op status "Gereed" gezet moet worden
- Bij ja: `PATCH /api/projects/<id>` met `{"status": "Gereed"}`
- Toon eindlink naar het rapport: `/report/<id>`

---
