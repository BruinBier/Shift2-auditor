# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Shift2 Auditor is a web application for conducting and reporting WCAG 2.2 accessibility audits. Built with Next.js 14 App Router, TypeScript, Prisma ORM with PostgreSQL, and Tailwind CSS.

## Essential Commands

```bash
# Development
npm run dev                 # Start development server (localhost:3000)
npm run build              # Production build
npm run lint               # Run ESLint

# Database
npx prisma migrate deploy  # Apply migrations (user must run manually)
npx prisma generate        # Generate Prisma client (after stopping dev server on Windows)
npm run db:studio          # Open Prisma Studio GUI
npm run db:seed            # Seed WCAG 2.2 criteria and research types

# Backup & Restore
npm run backup             # Export all data to JSON
npm run restore            # Import data from JSON backup
```

## WCAG-checklists (referentiemateriaal)

Bij het uitvoeren van WCAG-audits: gebruik de checklists in `wcag-checklists/`. Start met `wcag-checklists/Project_Instructie_WCAG_Audit.md` voor de werkwijze en het bevindingformat. Per SC is een `Checklist_SC_X_X_X.md` beschikbaar, voor sommige SC's ook `Richtlijnen_Grensgevallen_SC_X_X_X.md`. Gebruik `Voorbeelden_Bevindingen.md` voor schrijfstijl. Zie `wcag-checklists/README.md` voor het volledige overzicht.

## Audit CLI (for Claude Code use)

When the user asks you to audit a website and log findings, use `npm run cli` instead of the UI. The CLI (`scripts/audit-cli.ts`) calls the Next.js API, so the dev server must be running. All commands output JSON to stdout so you can parse results and chain calls.

```bash
# Read
npm run cli -- list-projects
npm run cli -- get-project <projectId>            # scope URLs, sample items, findings, assessments
npm run cli -- list-criteria                       # all WCAG criterion IDs + codes
npm run cli -- search-quick-findings <keyword>     # reuse finding templates

# Pagina's bekijken — altijd via de CLI, nooit via een ingebouwde browser
npm run cli -- get-html <url> [--text] [--full]
npm run cli -- get-screenshot <url> [--full-page] [--selector=css] [--voor=1.1.1]  # --voor is verplicht bij --selector: een opname van één element hoort bij één criterium
npm run cli -- get-leesvolgorde <url> [--zonder-css]   # voor 1.3.2: code-volgorde vs. kijkvolgorde
npm run cli -- get-nietteksten <url> [--klik=...]      # voor 1.4.11: zoekt zelf op wat eronder valt en meet het
npm run cli -- get-toetsenbordval <url> [--scope=pagina] [--typ-in=css --typ=woord] [--achteruit=true]  # 2.1.2
npm run cli -- get-videos <url> [--scope=main] [--doorloop=2]  # voor 2.1.4: leest de insluitcode van elke video; --doorloop loopt formulierstappen door
npm run cli -- get-beweging <url> [--seconden=5] [--vanaf=3] [--klik=...]  # 2.2.2: kijkt of er iets uit zichzelf beweegt of bijwerkt
npm run cli -- get-flitsen <url> [--seconden=10] [--klik=...]  # 2.3.1: telt de helderheidssprongen in de beeldjes die de browser tekent
npm run cli -- get-flitsen <video-url>                         # een YouTube- of Vimeo-adres: meet de video op zijn eigen pagina, met de speler aan
npm run cli -- get-videosporen <url|video-url> [--max=5] [--klik=...]  # 1.2.3/1.2.5: ondertitel- en audiosporen per video, plus drie beeldjes voor open ondertiteling
npm run cli -- get-links <url> [--scope=pagina|main] [--klik=...]  # 2.4.4: rekent per link de toegankelijke naam uit
npm run cli -- get-labelinnaam <url> [--scope=pagina|main] [--klik=...]  # 2.5.3: zichtbare tekst tegen de toegankelijke naam
npm run cli -- get-consistentie <projectId|url> [--max=12]  # 3.2.4: legt de paginas van de steekproef naast elkaar
npm run cli -- get-pixelcontrast <url> --selector=css [--klik="tekst:Contrast verhogen"]  # 1.4.11: randcontrast op de beeldpunten

# Write
npm run cli -- create-sample-item <projectId> --title="Homepage" --url=https://... --type=structured
npm run cli -- create-finding <projectId> --criterion=<criterionId> --description="..." --advice="..." --impact=matig --responsibility=redacteur --sample-items=<sampleItemId1>,<sampleItemId2>
npm run cli -- create-finding-from-quick <projectId> <quickFindingId> --sample-items=<sampleItemId>
npm run cli -- save-checks <projectId> --bron=workflow < oordelen.json   # oordeel per sample per criterium
npm run cli -- save-gebieden <projectId> --sample=<id> --criterium=1.3.1 < gebieden.json  # los bijwerken; normaal gaan ze mee met save-checks
npm run cli -- set-assessment <projectId> --criterion=<criterionId> --status=failed
```

**Typical flow for "check site X, log issues":**
1. `list-projects` → find the target project
2. `get-project <id>` → read existing context (don't duplicate findings)
3. `create-sample-item` for each page you review → get `sampleItemId`s
4. `create-finding` with the `sampleItemId`s → komt binnen als **voorstel**, en telt pas mee nadat de onderzoeker akkoord geeft

**Valid enum values:**
- `--impact`: `klein` | `matig` | `serieus` | `kritiek` | `onbekend`
- `--responsibility`: `redacteur` | `ontwikkelaar` | `ontwerper` | `onbekend`
- `--status` (finding): `voorstel` | `open` | `published` | `resolved` | `afgewezen` (default `voorstel`)
- `--status` (assessment): `passed` | `failed` | `not_present` | `unknown` | `not_tested`
- `--type` (sample): `structured` | `random` | `pdf`
- `--bron` (save-checks): `workflow` | `gesprek` | `handmatig`

**Notes:**
- Wat jij aanmaakt is een **voorstel**, geen bevinding. Het telt nergens mee — niet in het criteriumoordeel, niet in het rapport — tot de onderzoeker akkoord geeft in het tabblad "Waar sta ik". Zie `docs/adr/0001-akkoord-als-poort.md` en de woordenlijst in `CONTEXT.md`.
- Finding codes worden toegekend: `V001` voor een voorstel, `B001` pas bij akkoord. Geef er zelf nooit een mee.
- Het criteriumoordeel volgt uit de bevindingen en wordt herberekend bij aanmaken, wijzigen en verwijderen (`lib/criterion-assessment.ts`). Zet het niet zelf met `set-assessment` tenzij je het echt handmatig wilt overrulen.
- Een opmerking (`type=opmerking`, geen impact) keurt een criterium **niet** af.
- **Een criterium met deelgebieden komt er niet in zonder die gebieden.** 1.1.1, 1.3.1, 1.4.3 en 2.4.4 bestaan uit meerdere losse vragen; die staan onder `### Deelgebieden` in hun regelbestand. Die lijst is de enige bron: zet er een gebied bij en de weigering geldt meteen, zonder dat er code verandert. Stuur ze mee in hetzelfde `save-checks`-bericht — `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking", "toelichting": "..." }]` — anders wordt het oordeel geweigerd met de namen erbij die nog ontbreken. Kon je een gebied niet beoordelen, dan is dat `nvt` met een toelichting: dát je het niet kon is precies de informatie die een lopende onderbouwing weglaat. Een agent die drie van de zes gebieden overslaat en over de andere drie netjes schrijft, levert iets op dat er hetzelfde uitziet als volledig werk.
- **`reden` is één of twee zinnen** bij een criterium met deelgebieden: of de meting geldig was — kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en verder niets. Al het inhoudelijke gaat naar de deelgebieden: waaróp je hebt gezocht schrijf je bij het gebied waar je zocht, en een afweging bij het gebied waar hij over gaat. Er is bijna nooit iets dat bij geen enkel gebied thuishoort.
- Linking uses `SampleItem + FindingOccurrence` (the manual/UI path), not `ScopeUrl + FindingUrl` (crawler path).
- Override base URL if needed: `AUDIT_CLI_BASE_URL=http://localhost:3001 npm run cli -- ...`

### Deelgebieden: waar ze staan en wie ze mag aanvullen

De deelgebieden van een criterium staan onder `### Deelgebieden` in zijn regelbestand, en
nergens anders. Geen kopie in de database: de kaart leest het bestand rechtstreeks en de agent
krijgt het als huisregels mee, dus een tweede plek zou een tweede waarheid worden.

De onderzoeker kan er zelf een bij zetten. Op de kaart in "Waar sta ik" staat onder de
gebiedenlijst een veld met "Aan de regels toevoegen"; dat schrijft naar het regelbestand via
`POST /api/wcag-regels/deelgebied` (alleen op de dev-server). Vanaf dat moment moet elke agent
dat gebied aflopen, op elke pagina en in elk project — het is een regel, geen aantekening bij
één oordeel. Bestaande oordelen krijgen er een open ring bij; hun akkoord blijft staan, want
dat gold voor de tekst die er lag.

### Eén criterium opnieuw laten beoordelen

`audit-samples` zet één agent per **pagina** neer die alle criteria afgaat. Dat is efficiënt,
maar het maakt niet zichtbaar of die agent bij criterium zesentwintig nog even scherp was als
bij criterium één. Moet één criterium alsnog of opnieuw beoordeeld worden, gebruik dan
`.claude/workflows/audit-criterium.js`. Daar is de eenheid van werk het **criterium**: elke
agent krijgt er precies één, plus één pagina, plus het regelbestand dat erbij hoort. Wat hij
daarbuiten ziet, laat hij liggen.

**De auditsessie start vanzelf.** Draait er geen Chrome op poort 9222, dan start de workflow er
zelf een (`npm run cli:chrome-los`, hetzelfde script als `chrome:debug` maar losgekoppeld, met
hetzelfde auditprofiel) en wacht tot de poort antwoordt. Dat moet, want de CLI valt anders
stilzwijgend terug op headless — en dan mist de meting alles wat pas na een klik in de code
komt: uitklapblokken, menu's, formulierstappen achter een sessie. Dat ziet er niet uit als een
fout maar als een pagina waar het niet op staat, en dat leverde op 15 augustus 2026 drie
afkeuringen op die geen van drieën bestonden. Achteraf zie je het aan de oranje badge op de
kaart, maar dan is het werk al gedaan.

```
Workflow({ scriptPath: '.claude/workflows/audit-criterium.js',
           args: { projectId: '...', criterium: '2.4.4' } })
```

Vlaggen: `samples` (alleen deze pagina's), `homepageSampleId` (welke pagina header en footer
meeneemt), `drooglopen: true` (alleen rapporteren, niets wegschrijven), `headlessMag: true`
(bewust zonder auditsessie — alleen bij een openbare pagina zonder login, cookiemuur of
uitklapblokken die ertoe doen).

Na de pagina-agents komt er één die de bevindingen samenvoegt. Dat is het enige moment waarop
ze allemaal naast elkaar liggen — geen pagina-agent kan weten dat dezelfde footerlink op tien
andere pagina's net zo staat, en zonder die stap komt hetzelfde tien keer in het rapport.

Aanroepen met `scriptPath`, niet met `name`: dat laatste laadt een oudere geregistreerde kopie
en negeert wijzigingen.

**Een workflowscript kan niet zelf naar localhost.** `fetch('http://localhost:...')` in het
script mislukt: het draait in een afgeschermde omgeving zonder verbinding met de eigen machine.
Ook `process.env` bestaat er niet. Alles wat met de dev-server, de auditsessie of een lokale
poort te maken heeft, moet dus door een agent gedaan worden — die draait `curl` gewoon in de
shell. Op 2026-08-31 leverde die aanname het slechtst denkbare antwoord op: de workflow zag een
draaiende Chrome niet, startte er een tweede, en concludeerde daarna dat die ook niet draaide.

### Een meting toevoegen: registreer hem in `lib/metingen.ts`

Welke meting bij welk succescriterium hoort staat op één plek: `lib/metingen.ts`. Drie
plekken lezen die lijst — het logboek van de CLI (welke criteria een meting dient), de kaart
in "Waar sta ik" (welke meting de onderzoeker daar kan starten) en de route die de meting
uitvoert (wat er mag draaien en met welke vlaggen). Die laatste is een veiligheidsgrens: wat
er niet in staat, draait niet.

Bouw je een nieuw meetcommando, voeg het dan daar toe, met de vlaggen die het kent en met
`vanafDeKaart: true` als het zonder keuze vooraf te draaien is. Zet dat op `false` zodra er
eerst iets aangewezen moet worden — `get-pixelcontrast` moet weten wélk element het meet, en
een knop die dat zelf verzint meet het verkeerde. Zonder registratie werkt het commando wel
op de opdrachtregel, maar verschijnt het nergens in het scherm.

**De onderzoeker kan metingen zelf starten.** Op elke kaart in "Waar sta ik" staat onder "Zo
is het vastgesteld" wat er voor dat criterium te meten valt, met een knop "Meet dit nu". Ook
op de kaarten "Jij moet kijken" — juist daar, want dat is de kaart waarop staat dat iets niet
vast te stellen was. De uitkomst komt onder het oordeel te staan; het oordeel zelf verandert
er niet van, en een akkoord vervalt er niet door. Meten is bewijs verzamelen, geen uitspraak
doen.

### Welke browser gebruik je waarvoor

**Gebruik voor het beoordelen van websites altijd `get-html` en `get-screenshot`.** Die draaien een echte browser, dus de JavaScript van de site werkt.

**Gebruik daarvoor nooit een ingebouwde browser-pane.** Daar hydrateert React niet: de HTML staat er, maar er hangt geen enkele klikafhandelaar aan. Een knop doet dan niets, een uitklapmenu klapt niet uit, zoeksuggesties verschijnen niet — en dat ziet er precies zo uit als een echte bevinding. Op 15 augustus 2026 leverde dat drie afkeuringen op heuvelrug.nl op die geen van drieën bestonden.

`get-html` geeft een veld `gehydrateerd` terug. Staat dat op `false`, dan is er iets mis met de pagina zelf: trek dan geen conclusies over toetsenbord, menu's, schakelknoppen of zoeksuggesties.

**Moet je klikken, typen of schakelen om iets te kunnen beoordelen?** Start dan `npm run chrome:debug`. Dat opent een Chrome met foutopsporing op poort 9222, waar de CLI op aansluit met behoud van cookies en sessies. Let op: wat een test daar aanzet (zoals een hoogcontrastmodus in `localStorage`) blijft staan en beïnvloedt de volgende meting — zet het na afloop terug.

**Voor SC 1.3.2 is opgehaalde HTML niet genoeg.** De volgorde in de code is de halve
vraag; of de opmaak die volgorde omkeert staat in externe stylesheets. `get-leesvolgorde`
opent de pagina in een echte browser en rekent uit waar het volgende element in de code
visueel bóven of links van zijn voorganger staat. Filtert zelf de bekende valse meldingen
weg: elementen buiten het scherm, kolommen naast elkaar, en links die over twee regels
afbreken. Een omkering is geen bevinding zolang het verplaatste element geen betekenis
draagt — een afbeelding met een leeg tekstalternatief telt niet mee.

**Voor 1.4.11 begin je met `get-nietteksten`, niet met losse metingen.** Een oordeel over dat
criterium is een uitspraak over alles op de pagina; vier losse metingen zijn dat niet, ook niet
als ze alle vier voldoen. Dit commando loopt alle bedienbare elementen af, bepaalt in de browser
welke eronder vallen — een knop met alleen `sr-only`-tekst telt als pictogram, en dat zie je in
opgehaalde HTML niet — en meet die. Lees de lijst `overgeslagen_met_reden` na, en controleer dat
de aantallen optellen. Een pictogram wordt anders gemeten dan een veldrand: het doorzichtige
linkvak om een svg heeft geen rand, dus daar telt de tekening tegen zijn achtergrond. Elk
element wordt in ruststand én met de muis erop gemeten, want 1.4.11 geldt ook voor de
toestanden van een element; het strengste van de twee telt. Focustoestanden zitten er nog niet
in.

**SC 2.1.2 is te meten, niet te vragen.** `get-toetsenbordval` drukt Tab, leest na elke druk
uit welk element focus heeft, en herkent een val doordat de focus het gebied niet verlaat
terwijl een korte reeks zich herhaalt. Draai vier rondes: main-content, hele pagina, met een
widget open (`--typ-in`, want een suggestielijst bestaat pas ná typen), en achteruit
(`--achteruit=true`, want een val kan één kant op zitten).

**SC 2.2.2 vraagt om tijd, niet om code.** Of er iets uit zichzelf beweegt is uit opgehaalde
HTML niet te zien: "er is geen carrousel" en "ik heb niet gekeken of er een carrousel is"
leveren dezelfde zin op. `get-beweging` laat de pagina acht seconden staan en vergelijkt drie
opnamen — bij binnenkomst, na drie seconden en vijf seconden daarna. Het venster dat telt
begint pas ná die drie seconden, want daarvóór laden luie afbeeldingen en widgets nog in.
Vier zintuigen tegelijk: de beeldpunten (ziet ook een canvas en een kader van een ander
domein), de bijwerkingen in de code, de verplaatsingen van elementen, en wat de pagina zelf
opgeeft aan CSS-animaties en spelende media. Alleen bijwerkingen die iets aan de weergave
veranderen tellen mee — een attribuut dat omklapt is geen beweging. Van elk veranderd gebied
komt er een uitsnede vóór en ná; keur nooit af op het getal alleen. Beweegt er niets, dan is
2.2.2 `niet_aanwezig` en niet `voldoet`.

**SC 2.3.1 is niet met `get-beweging` te beantwoorden.** Die maakt drie opnamen met seconden
ertussen; een flits van drie per seconde zit dáártussen. `get-flitsen` leest daarom de beeldjes
mee die de browser tekent en telt per blok de tegengestelde helderheidssprongen (10% van de
schaal, donkerste onder 0,80), plus de aparte toets op verzadigd rood. De gebiedsgrens is een
kwart van een gezichtsveld van tien graden — ongeveer 2,8% van het beeld, niet "een kwart van
het scherm", want een klein flitsend vlakje zakt ook. Komen er geen beeldjes, dan heeft de
pagina niet opnieuw getekend en kan er niets geflitst hebben: dat is `voldoet`, niet
`niet_aanwezig`. Dit is een zeef en geen keuring: het beeld wordt verkleind en samengeperst,
en alleen wat in beeld staat wordt opgenomen. Laat een videobestand door PEAT halen voor een
echt oordeel.

**Een video op de pagina meet je niet op de pagina.** Hij zit in een kader van een ander
domein, staat achter een toestemmingsscherm of toont een stilstaand voorblad; de tekenopnemer
krijgt dan niets te zien en de uitkomst wordt ten onrechte "er gebeurt niets". Geef daarom het
videoadres zelf mee — `get-flitsen https://www.youtube.com/watch?v=<nummer>` — dan opent het
commando de video op zijn eigen pagina en zet de speler gedempt aan. Eerst het insluitadres;
weigert YouTube dat (Fout 153, "fout bij configuratie van videospeler"), dan de watchpagina.
Op een gewone pagina somt `get-flitsen` de gevonden video's op mét de regel om ze apart te
meten.

Staat er een toestemmingsvenster voor ("Voordat je verdergaat naar YouTube"), dan meldt het
commando dat en klikt het niet weg: toestemming geven is een keuze van de onderzoeker. Wil je
eromheen, geef dan `--klik="tekst:Alles afwijzen"` mee of accepteer eenmalig in de
audit-sessie-Chrome. Zonder dat blijft de uitkomst `beslist: false` — een speler die niet
gespeeld heeft is niet gemeten.

**Voor 1.2.3 en 1.2.5 lees je de sporen van de speler, niet de pagina.** `get-videosporen`
opent elke video op zijn eigen pagina en leest uit `ytInitialPlayerResponse` welke
ondertitelsporen er zijn — inclusief of ze automatisch gegenereerd zijn (`kind: "asr"`, en
dat telt niet als ondertiteling) — en welke audiosporen. Een video met audiodescriptie heeft
daar een tweede audiospoor met "descriptive" of "beschrijvend" in de naam; staat dat er niet,
dan is er geen audiodescriptiespoor. Zijn de formaten niet af te lezen, dan is dat
`niet af te lezen` en geen "geen": een gok is geen meting.

**Niet elke speler is YouTube of Vimeo.** Bij een eigen speler (Blue Billywig, JW Player,
Bitmovin) staan de sporen nergens in de code: de speler tekent zijn ondertiteling zelf, geeft
geen `<track>`-elementen door en verstopt zijn hele bediening in **shadow DOM**. Een gewone
`querySelector` komt daar niet, en dan lijkt een pagina met een volledig toegankelijke speler
een pagina zonder knoppen. `get-videosporen` loopt daarom alle afgeschermde wortels en alle
ingesloten kaders af, en leest de knopnamen: *"Zet ondertitels uit"* betekent dat ondertiteling
aanstaat, *"Zet uitgeschreven tekst aan"* dat er een transcript is. Dat is een afleiding uit
een tekst en geen meting van de ondertiteling zelf; zo staat het er ook bij. De uitgeschreven
tekst wordt meegenomen met zijn lengte, want een kopje "Transcript" boven drie regels is geen
tekstalternatief.

**Een pagina die slaapt, meet je niet.** Versnellers als WP Rocket stellen álle scripts uit tot
de bezoeker iets doet. Zonder muisbeweging staat er dan geen speler, geen menu en geen widget —
en dat ziet er precies zo uit als "die zijn er niet". `openPage` telt daarom hoeveel scripts
staan te wachten en maakt de pagina wakker als dat er zijn. Op de webinarpagina van Blue
Billywig stonden er vijftien te wachten; na één muisbeweging laadden er 36 scripts en stond de
video er gewoon. Zie ook `gehydrateerd` bij `get-html`.

Daarnaast legt het drie beeldjes vast, verspreid over de duur, uitgesneden op de speler.
Dat is het enige middel om **open** ondertiteling te zien: die zit in het beeld gebrand en
staat in geen enkele gegevensbron. Op "Graven in het Groen, afl. 3" geeft YouTube alleen een
automatisch spoor op, terwijl er ingebrande ondertiteling in beeld staat — precies de valkuil
uit `Shift2_Werkwijze_Video.md`. Doorspoelen kan niet: `currentTime` en de eigen `seekTo` van
de speler blijven op `seeking` hangen, dus elk beeldje krijgt een eigen laadbeurt met
`&t=<seconden>s`.

**Staat een element op een foto of een verloop, dan zeggen stijlwaarden niets.** `getComputedStyle`
geeft daar `rgba(0,0,0,0)`, en rekenen met die waarden levert ten onrechte "voldoet" op.
`get-pixelcontrast` maakt een opname, leest de werkelijke beeldpunten uit en geeft de slechtste
verhouding per zijde plus een uitsnede op acht keer van elke zijde onder de 3:1. Per plek wordt
een bandje van vijf beeldpunten naar binnen afgetast — randlijn én vulling tellen mee, en een
rand van één beeldpunt ligt zelden precies waar je hem verwacht — en de hoekronding wordt
overgeslagen, anders keurt elke afgeronde knop af op een hoek waar je langs het element heen
kijkt. Heeft de site een hoogcontrastknop die voldoet, meet dan mét `--klik`: die weergave is
de weergave die telt. Keur nooit af op het getal alleen; leg de uitsnede ernaast.

**SC 2.4.4 gaat over wat er wordt voorgelezen, niet over wat je ziet.** `get-links` rekent per
link de toegankelijke naam uit in de volgorde uit `Shift2_Regels_SC_2_4_4.md`:
`aria-labelledby`, `aria-label`, de tekst binnen de link zonder wat op `aria-hidden` staat
(plus het tekstalternatief van een afbeelding erin), en pas dan `title`. Dat verschil is
precies waar het misgaat: het icoon in een sociale-media-link telt niet mee, een `sr-only`-span
die je nergens ziet telt wél mee, en een naam die alleen uit `title` komt is onvoldoende en
blijft een afkeuring. Op heuvelrug.nl heeft de logolink alleen `title="Ga naar de homepage"` en
een leeg `alt`; de auditronde noteerde "in orde" en gaf 2.4.4 `voldoet`.

Het commando keurt niets af. Het meldt de mechanische gevallen — geen naam, alleen een title,
een generieke tekst zonder context in hetzelfde element, alleen de platformnaam, een tekst die
een ander doel belooft dan de bestemming — en zet de volledige lijst in het overzicht, want een
naam als "Meer over paspoorten" moet een mens wegen. Let op twee dingen die de regels
uitdrukkelijk uitsluiten: een kop bóven de link geeft geen context (alleen hetzelfde element
telt), en een telefoonnummer met een kapotte belkoppeling is een functioneel probleem en geen
2.4.4-bevinding — die staan apart onder `belknoppen_zonder_werkende_koppeling`.

**Meet contrast op het element dat de tekst zelf bevat**, niet op een omhulsel. Een `<a>` met een `<span>` erin heeft vaak een andere kleur dan de span die je ziet; die verwarring leverde een niet-bestaande afkeuring van 1,25:1 op.

## Database & Prisma Workflow

### Critical User Preferences
- **User executes all migrations manually** - Never run `npx prisma migrate dev` or `npx prisma migrate deploy` automatically
- **Use production commands** - Always suggest `npx prisma migrate deploy`, NOT `npx prisma migrate dev`
- **Manual migration creation** - When schema changes:
  1. Create directory: `prisma/migrations/YYYYMMDD_description/`
  2. Create `migration.sql` with SQL changes
  3. User will run: `npx prisma migrate deploy`
  4. User will run: `npx prisma generate` (after stopping dev server)

### Windows-Specific Issue
On Windows, `npx prisma generate` fails with EPERM error if dev server is running:
```bash
# Solution: Stop server → Generate → Restart server
Ctrl+C
npx prisma generate
npm run dev
```

### ⚠️ IMPORTANT: Schema Change Workflow (for Claude Code)

When the user asks you to modify `prisma/schema.prisma`:

1. **FIRST** - Ask the user: "Is the dev server running? If yes, stop it with Ctrl+C before I make changes"
2. **THEN** - Make schema changes and create migration files
3. **FINALLY** - Instruct user to run:
   ```bash
   npm run schema:update
   npm run dev
   ```

**DO NOT:**
- Run `npx prisma generate` yourself (will fail if dev server is running)
- Assume dev server is stopped
- Skip asking about dev server status

**Example response:**
> "I'll add the `status` field to the Project model. First, please stop the dev server (Ctrl+C in the terminal where npm run dev is running). Let me know when it's stopped and I'll make the changes."

## Architecture

### Core Data Models

**Project Hierarchy:**
- `Project` → Contains all project metadata and rich text fields for report
- `ProjectScopeUrl` → URLs in scope (can have parent/child relationship via `parentUrlId`)
- `SampleItem` → Sample pages (types: structured/random/pdf)
- `CriterionAssessment` → Status per WCAG criterion per project
- `Finding` → Issues discovered with code, impact, responsibility
- `FindingOccurrence` → Links findings to specific sample items
- `CrawlerResult` → Test results from automated crawler (linked to ScopeUrl OR SampleItem)

**Supporting Models:**
- `WCAGCriterion` → WCAG 2.2 criteria (seeded, read-only)
- `QuickFinding` → Reusable finding templates
- `ResearchType` → Research type definitions with linked WCAG criteria
- `Opdrachtgever` → Client organizations
- `ClientProject` → Client project groupings

### Application Structure

```
app/
├── admin/                      # Admin interface
│   ├── projects/[id]/          # Project editing
│   │   ├── page.tsx            # Main project page with tabs
│   │   ├── ProjectAdminTabs.tsx # Tab navigation component
│   │   ├── tabs/               # Tab content components
│   │   │   ├── SampleItems.tsx
│   │   │   ├── FindingsManagement.tsx
│   │   │   └── ...
│   │   ├── scope/[scopeId]/    # Scope URL detail pages
│   │   ├── sample/[sampleId]/  # Sample item detail pages
│   │   ├── findings/[findingId]/ # Finding detail pages
│   │   └── crawler-overview/   # Crawler results overview
│   └── bevindingen/            # Quick findings library
├── report/[id]/                # Public report view
│   ├── page.tsx
│   ├── ReportTabs.tsx
│   └── tabs/                   # 4 report tabs
│       ├── AboutResearch.tsx
│       ├── Results.tsx
│       ├── Findings.tsx
│       └── Sample.tsx
├── onderzoeken/                # Projects list view
└── api/                        # API routes (Next.js route handlers)
```

### Key Subsystems

**Crawler System** (`lib/crawler/`)
- `tests.ts` - 130+ accessibility test functions using Cheerio HTML parsing
- `test-runner.ts` - Executes all tests and aggregates results
- `crawler-engine.ts` - Orchestrates crawling for entire projects
- `browser-crawler.ts` - Puppeteer-based browser automation
- `discovery.ts` - Link discovery for recursive crawling

Tests can be run on:
- Individual scope URLs via hamburger menu
- Sample items via hamburger menu
- Entire projects via crawler overview page

**Report Calculations** (`lib/report-calculations.ts`)
- Aggregates statistics from assessments and findings
- Calculates pass/fail counts per principle and level
- Groups results by WCAG principle (Perceivable, Operable, Understandable, Robust)
- Used by report tabs for displaying metrics

**AI Integration**
- OpenAI used for generating management summaries and researcher feedback
- Endpoints: `/api/projects/[id]/generate-summary` and `/api/projects/[id]/generate-feedback`

### State Management Pattern

This app uses **server-side rendering** with Next.js Server Components:
- Most pages are Server Components that fetch data directly
- Client Components (`'use client'`) used only for:
  - Forms and interactive UI
  - Modal dialogs
  - Tabs with client-side state
  - Real-time updates via `router.refresh()`

No global state management library - uses Next.js patterns:
- Server Actions for mutations (via API routes)
- `router.refresh()` to revalidate server components after mutations

### UI Patterns

**Modal Pattern:**
- Most modals use `showModal` state + conditional rendering
- Modals typically include:
  - Close on Escape key
  - Click outside to close
  - Form submission with router.refresh()

**Tab Pattern:**
- URL query params for tab state (`?tab=steekproef`)
- Consistent styling with border-bottom highlighting

**Markdown/Rich Text:**
- `md-editor-rt` for markdown editing in forms
- `marked` library for rendering markdown to HTML
- TipTap editor for WYSIWYG in some fields

## Important Implementation Details

### Sample Items vs Scope URLs
- **Scope URLs** - URLs tested during research (can be crawled, can have child URLs discovered)
- **Sample Items** - Representative pages documented in report (structured/random/pdf types)
- Both can have crawler results attached
- Findings link to sample items via `FindingOccurrence`, not directly to scope URLs

### Crawler Results Storage
`CrawlerResult` has EITHER `scopeUrlId` OR `sampleItemId` (both nullable, one must be set):
- Results from scope crawling → `scopeUrlId`
- Results from sample item testing → `sampleItemId`

### Finding Management
Findings can be created three ways:
1. Manual creation via UI
2. From crawler results (with auto-mapping to QuickFindings if available)
3. Auto-creation endpoint that creates findings for all positive crawler tests

Finding codes follow pattern: `{PROJECT_CODE}-{VERSION}-F{NUMBER}` (e.g., "SHP-3-F5")

### Print/PDF Export
Report pages include print-specific CSS:
- Hidden navigation/buttons in print mode
- Page break controls
- Optimized typography for PDF export via browser print (Cmd/Ctrl + P)

## Common Gotchas

1. **Prisma Client Generation** - Must stop dev server on Windows before running `npx prisma generate`

2. **Date Handling** - Always use `new Date()` for timestamps, format with `toLocaleDateString('nl-NL')`

3. **Nullable URLs** - Sample items can have null URLs (for PDF type), check before crawling

4. **Assessment Status Enum** - Uses snake_case in DB: `not_present`, `not_tested`, NOT camelCase

5. **Finding Impact Values** - Dutch values: `klein`, `matig`, `serieus`, `kritiek`, `onbekend`

6. **Router Refresh** - After API mutations, always call `router.refresh()` to update server components

7. **Markdown Rendering** - Use `marked.parse()` but check if content is already HTML with regex test first

## Testing Approach

No automated tests in codebase currently. Testing is manual:
- Use Prisma Studio to inspect database
- Use browser DevTools for debugging
- Use `/api/*` endpoints directly with curl/Postman for API testing

## Dutch Language

All user-facing text is in Dutch (Nederlands):
- Database enums use Dutch values
- UI labels and messages in Dutch
- Report content in Dutch
- Comments and code can be English or Dutch