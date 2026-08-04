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

## Stap 5 — De audit draaien

De volgorde is: **eerst de machine helemaal klaar, dan pas beoordelen.** Claude draait de
workflow over de hele steekproef, schrijft de uitkomst weg, en pas daarna bekijken jullie samen
wat eruit kwam. Niet pagina voor pagina in gesprek terwijl de audit loopt.

Reden: zolang de audit loopt, zie je alleen wat er gevonden is. Wat overgeslagen is valt pas op
als alles er staat en je het overzicht per criterium erbij pakt.

### Stap 5a — De workflow draaien

**Actie van Claude:**

1. Controleer dat de audit-sessie-Chrome draait (`curl -s http://localhost:9222/json/version`).
   Zo niet: vraag de gebruiker "Audit-sessie starten" aan te klikken in de tool.
2. Start de workflow met het **pad**, niet met de naam:

   ```
   Workflow({ scriptPath: ".claude/workflows/audit-samples.js",
              args: { projectId: "<id>" } })
   ```

   Met `{name: "audit-samples"}` draait een oude gecachete kopie; wijzigingen in de regels werken
   dan niet door.
3. Wacht tot de workflow klaar is. Bij twaalf samples duurt dat ongeveer twintig minuten.

**Wat de workflow doet:** één auditor-agent per sample, allemaal tegelijk. Elke agent loopt álle
criteria van het onderzoekstype af, leest daarbij de bestanden uit `wcag-regels/` en
`wcag-checklists/`, en levert per criterium een status met onderbouwing. Daarna controleert een
verifier de afkeuringen en wordt elk voorstel tegen de QuickFinding-bibliotheek gehouden.

**Wat de workflow NIET doet:** wegschrijven. Het resultaat is een voorstel-rapport; de database
blijft ongemoeid tot stap 5b.

De bestaande bevindingen in het project gaan als referentie mee. Elke afkeuring krijgt daardoor
het label `nieuw` of `bestaat_al`, zodat meteen zichtbaar is wat de vorige ronde miste.

### Stap 5b — Registraties wegschrijven

Schrijf per sample de beoordelingen weg naar de dekkingslijst met een PUT naar
`/api/sample-items/<sampleId>/criterion-checks`, met `bron: "workflow"`.

Dit gaat over de **dekkingslijst**, niet over bevindingen. Die laatste komen pas in stap 5d, na
akkoord. Voor de dekkingslijst is de Prisma-route prima; voor bevindingen niet (zie
`wcag-regels/Shift2_Schrijfregels.md`).

### Stap 5c — Vergelijken met wat er al lag

Had het project al bevindingen, leg die dan naast de verse audit:

- **Bestaande bevinding niet teruggekomen als afkeuring?** Zoek uit waarom. Soms is het terecht
  (de regels zijn aangescherpt), soms mist de audit iets, soms zit er een fout in de regel zelf.
- **Nieuwe afkeuring die er nog niet was?** Die gaat in stap 5d naar de gebruiker.

Meld de uitkomst voordat je verder gaat. Bij BEV-04 (2026-08-04) leverde deze vergelijking drie
fouten van de audit op, en elk daarvan legde een leemte in de regels bloot.

### Stap 5d — Bevindingen één voor één voorleggen

Geef eerst een **kort overzicht** van wat er gevonden is: per sample de afkeuringen en
opmerkingen, één regel elk. Daarna leg je ze **één voor één** voor, met de volledige tekst van
description en advice.

Per bevinding:

- Controleer eerst de QuickFinding-bibliotheek; bij een treffer neem je die tekst als
  uitgangspunt en vul je alleen de placeholders in
- Controleer of er al een bevinding voor hetzelfde issue bestaat; zo ja, koppel het sample aan
  de bestaande in plaats van een duplicaat te maken
- Wacht op akkoord voordat je wegschrijft
- Schrijf bevindingen via de API (`POST /api/projects/<id>/findings`), nooit rechtstreeks via
  Prisma: de API draait de schrijfregel-linter

Verandert er iets aan het oordeel, werk dan **ook de registratie in de dekkingslijst bij**, met
`bron: "gesprek"` en de afweging erin. Zo is achteraf te verantwoorden waarom iets géén bevinding
werd.

### Wat de auditor zelf meet en wat naar de gebruiker gaat

Deze criteria meet de auditor zelf in de audit-sessie-Chrome; ze horen niet standaard als vraag
terug te komen:

| SC | Hoe |
|---|---|
| 1.4.3 · 1.4.11 | Pixelmeting op de hoogcontrastknop, **één keer** op het homepage-sample |
| 1.4.10 | Viewport op exact 320 CSS-pixels, `scrollWidth` vergelijken |
| 2.1.2 | Tab versturen en `document.activeElement` uitlezen |
| 2.5.3 · 2.5.8 | Zichtbare tekst tegen toegankelijke naam; `getBoundingClientRect` |
| 1.2.3 · 1.2.5 | Audiospoor en transcript-knop uitlezen, open ondertiteling scannen |

Wat wél altijd naar de gebruiker gaat: **contrast in PDF-documenten**. Dat meet de onderzoeker
handmatig met de Colour Contrast Analyser.

### De criteria van het onderzoekstype

Voor een deelonderzoek content website (30 SC's):

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

Bij het onderzoekstype mét formulieren komen daar 3.3.1, 3.3.3 en 3.3.4 bij (33 SC's).

**Resultaat van stap 5:**
- Elk criterium op elk steekproefitem beoordeeld en vastgelegd in de dekkingslijst
- Bevindingen aangemaakt na akkoord, met de afwegingen in `reden`
- Klaar voor de dekkingscontrole in stap 6a

---


## Stap 6 — Rapportage afronden (automatisch na de bevindingen)

Zodra de bevindingen uit stap 5d zijn weggeschreven, gaat Claude **automatisch** door met deze afrondende stappen. Niet stoppen en wachten op verzoek — dit is onderdeel van de standaardworkflow. De volgorde is strikt:

### Stap 6a — Dekkingscontrole: is er nergens overgeslagen?

**Waarom deze stap eerst.** Alle volgende stappen kijken naar wat er gevónden is: welke bevindingen er zijn, welke statussen daaruit volgen, wat er in de samenvatting moet. Geen van die stappen ziet wat er níet is gedaan. Staat 2.4.6 op vijftien van de twintig samples geregistreerd, dan komt er gewoon een status uit en valt niet op dat vijf pagina's zijn overgeslagen. Een gat in de dekking is per definitie onzichtbaar in de uitkomst; je moet er apart naar kijken.

**Actie van Claude:**

```bash
npm run cli -- get-dekking <projectId>
```

Dat geeft drie soorten gaten, oplopend in ernst:

| Wat | Betekenis | Wat te doen |
|---|---|---|
| `ontbrekend` | Geen registratie: er is niet naar gekeken | Alsnog beoordelen, of vastleggen waarom niet |
| `zonderOnderbouwing` | Status `voldoet` met een leeg `reden`-veld | Alsnog onderbouwen, of opnieuw beoordelen |
| `openVragen` | Status `niet_te_bepalen` | Aan de onderzoeker voorleggen |

`ontbrekend` en `zonderOnderbouwing` moeten op nul staan voordat je verder gaat; `dekkingCompleet` in de uitvoer zegt of dat zo is. Open vragen blokkeren niet: die zijn bewust opengelaten.

**Waarom een lege `reden` bij `voldoet` als gat telt.** Een afkeuring komt in het rapport en wordt gelezen, dus daar valt een fout op. Een goedkeuring levert geen tekst op: het criterium staat groen en er is niets om over te struikelen. `voldoet` is dus de status waar een fout onzichtbaar blijft, en zonder toelichting is niet te zien of het oordeel uit onderzoek komt of uit gemakzucht.

**Leg de uitkomst aan de gebruiker voor**, ook als er niets ontbreekt. Bij twintig samples en 33 criteria zijn dat 660 registraties; het getal "660 van 660, geen gaten" is zelf het resultaat van deze stap. Bundel de open vragen per criterium, niet per sample: dezelfde vraag komt vaak op meerdere pagina's terug.

### Stap 6b — Assessment-statussen controleren

**Eerst** alle WCAG-criterium-assessments nalopen, vóór de management-samenvatting. Bij het wegschrijven van een open bevinding zet de tool het criterium automatisch op `failed`, maar dat is geen volledige controle:
- Criteria zónder bevinding staan vaak op `not_present` of nog op niets — moeten naar `passed` als ze daadwerkelijk getoetst zijn
- Opmerkingen (status `resolved`) leiden niet automatisch tot `failed`; de assessment moet handmatig op de juiste status
- Sommige criteria zijn `not_present` (geen audio/video aanwezig, geen flits-content, geen formulier op niet-formulier-pagina's) en moeten dat ook blijven

**Actie van Claude:**
- Haal alle assessments op via een Prisma-query of via `get-project` en de bijbehorende endpoint
- Maak een overzicht van alle 30 SC's (of het aantal van het researchtype) met huidige status en koppeling aan eventuele bevindingen
- Markeer welke statussen mogelijk niet kloppen (bv. `not_present` waar wel iets is getoetst, `failed` zonder bevinding, lege status)
- Leg het overzicht aan de gebruiker voor; vraag expliciet om de statussen handmatig bij te werken of, indien gewenst, op te geven welke wijzigingen Claude moet doen via `set-assessment`
- Wacht op bevestiging dat alle statussen kloppen vóór door te gaan met stap 6c

### Stap 6c — Onderzoeker-feedback schrijven (verschijnt op tabblad Conclusie)

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
- **Eerst de bevindingen controleren op dubbelingen.** Bij het schrijven van de feedback heb je alle bevindingen naast elkaar; dat is het moment om te zien of er twee keer hetzelfde staat. Haal de volledige lijst op met description, criterium en gekoppelde sample-items, en kijk of er bevindingen zijn met dezelfde tekst op hetzelfde sample, of hetzelfde issue onder hetzelfde criterium op verschillende samples (die horen samengevoegd, zie [[feedback_merge_repeat_issues]]). Meld wat je vindt en vraag of het weg mag; verwijder niets zelf.
- Eerste concept zelf schrijven op basis van de bevindingen
- Concept aan gebruiker voorleggen voor akkoord en aanpassingen
- Pas na akkoord opslaan via `PATCH /api/projects/<id>` met `{"researcherFeedback": "<p>...</p><p>...</p>"}`

**Niet invullen:**
- `managementSummary` blijft leeg (consistent met de meeste Gereed-projecten). Alleen URK-01 heeft dit veld gevuld met een procedurele tekst over de scope; dat is een uitzondering en bij een gewoon deelonderzoek content niet nodig.

### Stap 6d — Project finaliseren

Pas na akkoord op samenvatting en feedback:
- Vraag aan gebruiker of het project op status "Gereed" gezet moet worden
- Bij ja: `PATCH /api/projects/<id>` met `{"status": "Gereed"}`
- Toon eindlink naar het rapport: `/report/<id>`

---

## Stap 7 — Tussencheck en herinspectie

Na de nulmeting pakt de opdrachtgever de bevindingen op. De onderzoeker controleert dat in de
**tussencheck** en legt het eindresultaat vast in de **herinspectie**.

### Hoe het in de tool zit

Bij het afronden van de nulmeting ontstaat een **kindproject** (versie 1.1) dat scope,
steekproef, assessments en alle bevindingen overneemt. Het bovenliggende project blijft bestaan
als versie 1.0: dat is en blijft het nulmetingsrapport.

Elk project heeft een fase (`checkPhase`): `nulmeting` → `tussencheck` → `herinspectie` →
`afgerond`. Elke bevinding onthoudt in welke fase hij is ontdekt (`discoveredInPhase`), en
heeft twee velden voor de tussencheck: `interimReviewed` (nagelopen) en `interimNotes`
(wat de onderzoeker zag).

### Wat je toetst

**Alleen de succescriteria waar bevindingen op zaten.** Bij een herinspectie loop je niet de
hele steekproef opnieuw af. Criteria zonder bevindingen houden hun status uit de nulmeting:
stond 2.4.6 op "voldoet", dan blijft dat zo.

### Per bevinding

| Uitkomst | Wat je doet |
|---|---|
| Opgelost | status naar `resolved` |
| Niet opgelost | laat op `open` staan; het criterium blijft afgekeurd |
| Nieuw ontdekt | nieuwe bevinding met `discoveredInPhase: herinspectie` |

**Let op: een opgeloste bevinding blijft een BEVINDING.** Maak de impact niet leeg om aan te
geven dat iets is opgelost. Impact en type zijn aan elkaar gekoppeld (lege impact = opmerking),
en dan verandert een serieuze afkeuring stilletjes in een opmerking. Bij Heerlen-01 gebeurde
dat met tien bevindingen. De API beschermt hier inmiddels tegen, maar wijzig het type nooit met
de hand bij een opgelost punt.

### Per opmerking

Opmerkingen blijven staan. Is er iets mee gedaan, vink dan `interimReviewed` aan en noteer in
`interimNotes` wat je zag. Alleen afgevinkte opmerkingen verdwijnen uit het herinspectierapport;
de rest blijft zichtbaar.

### Hoe het rapport eruitziet

Wat is opgelost, **verdwijnt uit het herinspectierapport**. Je laat opgeloste bevindingen dus
niet staan met het label "opgelost" erbij. Het criterium gaat van "Voldoet niet" naar "Voldoet",
en dát laat zien dat er gerepareerd is.

Bij een volledig geslaagde herinspectie ziet de opdrachtgever:

| Onderdeel | Inhoud |
|---|---|
| Scores | bijvoorbeeld 30 van 30 (100%) |
| Bevindingen | leeg |
| Opmerkingen | leeg, als ze in de tussencheck zijn afgevinkt |
| **Feedback van onderzoeker** | hier vertel je wat er is opgelost |

De feedback is de plek waar het verhaal staat. Het rapport beschrijft de situatie nu, de
feedback beschrijft de weg ernaartoe. Benoem concreet wat er is verbeterd, in dezelfde stijl
als stap 6b. Voorbeeld uit Heerlen-01 v1.1: "De bevindingen uit het eerdere onderzoek zijn
opgelost. In de footer staan de sociale-media-links nu als opsomming, met een linktekst die
duidelijk maakt dat het om de pagina van de gemeente gaat."

Wie de details van vóór de reparatie wil zien, leest het nulmetingsrapport (versie 1.0).

---
