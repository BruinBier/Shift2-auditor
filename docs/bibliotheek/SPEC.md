# Bouwspecificatie Shift2-auditor: bevindingenbibliotheek en oefenmodule

Versie 17 oktober 2026 · opdrachtgever: Frits (toegankelijkheidsspecialist Shift2)

## Doel

De Shift2-auditor krijgt een
**patronenbibliotheek** (in de app: "Patronen"; niet
"bevindingenbibliotheek", want zo heten de bestaande
QuickFindings al): één plek met vastgestelde oordelen per
foutpatroon, opgebouwd uit externe auditrapporten, met oefencasussen
en directe koppeling aan audits.

Wat het oplost:

- Hetzelfde patroon krijgt nu per audit een andere formulering,
  soms een ander WCAG-criterium.
- Externe auditors (Cardan, Accessy, Proper Access, Swink,
  Stichting Accessibility) oordelen verschillend over hetzelfde
  patroon; dat is nergens zichtbaar.
- Er is geen oefenmateriaal met echte code.
- Templatefouten (SIMsite/Drupal) zijn niet te onderscheiden van
  contentfouten.

Bestaande prototypes (map `prototypes/`, losse HTML) zijn de
visuele en functionele referentie. De module vervangt ze.

Buiten scope: automatisch scannen van websites, PDF-analyse zonder
menselijke controle, publieke versie.

## Begrippen

| Begrip | Betekenis |
| --- | --- |
| Patroon | Terugkerend type fout of twijfelgeval, met één Shift2-oordeel |
| Casus | Werkend testgebied (HTML/CSS/JS) bij een patroon |
| Bron | Een extern of eigen auditrapport |
| Rapportbevinding | Wat één rapport over één patroon zei |
| Auditor | Bureau achter een rapport |

Oordeel: `afkeur`, `geen-afkeur`, `advies`, `twijfel`.
Herkomst: `template`, `content`, `configuratie`, `extern`.

## Datamodel

De app gebruikt Prisma. Vertaal onderstaande types naar
Prisma-modellen in `prisma/schema.prisma` (met migratie) en
volg de conventies uit `CLAUDE.md` en `ARCHITECTURE.md`.
Arrays zoals `criteria` en `tags`: Postgres-tekstlijst
(`String[]`, zoals `Project.technologies`). Criteria zijn
codes; de app controleert bij import en opslaan dat elke
code in `wcag_criteria` staat en weigert anders, met de code
erbij. Titels komen altijd uit `wcag_criteria`. Zie besluit 5.

```ts
type Oordeel =
  | 'afkeur'
  | 'geen-afkeur'
  | 'advies'
  | 'twijfel';

type Herkomst =
  | 'template'
  | 'content'
  | 'configuratie'
  | 'extern';

type WcagVersie = '2.0' | '2.1' | '2.2';

interface Patroon {
  id: string;           // 'P-131-rijkop-als-td'
  titel: string;
  omschrijving: string;
  criteria: string[];   // ['1.3.1']
  oordeel: Oordeel;     // Shift2-oordeel
  onderbouwing: string;
  technieken: string[]; // ['F91','H51']
  herkomst: Herkomst;
  wcag: WcagVersie[];
  standaardTekst: string; // auditbevinding
  advies: string;
  tags: string[];
  status: 'concept' | 'vastgesteld';
  vastgesteldDoor?: string;
  vastgesteldOp?: string; // ISO-datum
}

interface Casus {
  id: string;           // 'HUW-R3'
  patroonId: string;
  titel: string;
  html: string;         // testgebied
  css?: string;
  js?: string;
  correcteCode: string; // leeg = in orde
  uitleg: string;
  isValkuil: boolean;
  oefenset: string[];   // ['131'], ['HUW']
  volgorde: number;
}

interface Bron {
  id: string;
  organisatie: string;
  onderdeel: string;
  auditorId: string | null;
  type: string;         // volledig, content, ...
  wcag: WcagVersie | null;
  datum: string | null;
  url: string;
  bestand?: string;
  hoofdsite: boolean;
  cms?: string;
  vertrouwelijk: boolean;
  status: 'gevonden' | 'gedownload'
        | 'verwerkt';
}

interface RapportBevinding {
  id: string;
  bronId: string;
  patroonId: string;
  casusId?: string;
  rapportCriteria: string[];
  rapportOordeel: Oordeel;
  citaat: string;
  pagina?: string;
  overeenstemming:
    | 'eens'
    | 'ander-criterium'
    | 'te-streng'
    | 'te-soepel';
  toelichting?: string;
}

interface Auditor {
  id: string;
  naam: string;
  rapportvorm: 'pdf' | 'online';
  rapportOverzicht?: string;
}

interface AuditBevinding {
  id: string;
  projectId: string;    // bestaand project
  patroonId?: string;   // leeg = vrij
  criteria: string[];
  oordeel: Oordeel;
  tekst: string;
  paginaUrl: string;
  herkomst: Herkomst;
  afwijkendVanPatroon: boolean;
  redenAfwijking?: string;
}
```

Regels:

- Oordeel en criteria staan alleen op het patroon, niet op de
  casus. Een casus toont altijd het oordeel van zijn patroon.
- Alleen patronen met status `vastgesteld` en oordeel ≠ `twijfel`
  zijn invoegbaar in audits.
- `overeenstemming` berekenen: rapport `afkeur` + patroon
  `afkeur` → `eens` als rapportcriteria een deelverzameling van
  patrooncriteria zijn, anders `ander-criterium`. Rapport `afkeur`
  + patroon niet `afkeur` → `te-streng`. Rapport niet `afkeur` +
  patroon `afkeur` → `te-soepel`. Anders `eens`. Handmatig te
  overschrijven.
- `afwijkendVanPatroon` wordt `true` zodra oordeel of criteria
  van een auditbevinding afwijken van het patroon; dan is
  `redenAfwijking` verplicht.

## Schermen

| Route | Scherm |
| --- | --- |
| `/admin/bibliotheek` | Patronenbibliotheek |
| `/admin/bibliotheek/:patroonId` | Patroondetail |
| `/admin/bronnen` | Rapportenregister |
| `/admin/bronnen/:bronId` | Rapport verwerken |
| `/admin/auditors` | Vergelijking auditors |
| `/oefenen/:set` | Oefenmodus |

### Patronenbibliotheek

- Lijst: id, titel, criteria, oordeel als gekleurde pill,
  herkomst, aantal casussen, aantal rapportbevindingen, status.
- Filters: criterium, oordeel, herkomst, tag, status, "wijkt af
  bij minstens één auditor".
- Vrij zoeken in titel, onderbouwing, standaardtekst en casus-HTML.
- Standaard gesorteerd op aantal rapportbevindingen, hoogste eerst.
- Knop Nieuw patroon.

### Patroondetail (drie tabs)

1. Oordeel: alle velden bewerkbaar. Naar `vastgesteld` vraagt
   bevestiging en vult `vastgesteldDoor`/`vastgesteldOp`.
2. Casussen: lijst + casuseditor.
3. In rapporten: auditor, organisatie (niet bij vertrouwelijk),
   rapportcriterium, rapportoordeel, overeenstemming, citaat.

Casuseditor:

- Codevelden HTML, CSS, JS met syntaxkleuring
  (CodeMirror of Monaco).
- Live voorbeeld in sandboxed iframe:
  `sandbox="allow-scripts"`, zonder `allow-same-origin`.
- Velden Correcte code en Uitleg.
- Afbeeldingen uploaden; in HTML staat de bestandsnaam.
- Waarschuwing bij opslaan als de HTML lijkt op klantdata
  (e-mailadres, telefoonnummer, URL van een klantsite).

### Rapportenregister

- Tabel van bronnen met filters: WCAG 2.2, hoofdsite, auditor,
  status.
- Rapport toevoegen: URL of PDF-upload + metadata.
- Vertrouwelijke bronnen alleen zichtbaar voor admins; hun
  organisatienaam verschijnt nergens anders.

### Rapport verwerken

- Links het rapport (PDF-viewer, iframe, of geëxtraheerde tekst).
- Rechts de rapportbevindingen: citaat, rapportcriterium en
  -oordeel, koppelen aan patroon (zoeken met suggesties op
  criterium + woorden uit citaat) of nieuw patroon aanmaken
  (status `concept`, oordeel `twijfel`).
- Overeenstemming direct zichtbaar.
- Afronden zet bron op `verwerkt`.
- Fase 3, optioneel: knop "Bevindingen voorstellen" via een
  taalmodel; altijd handmatig bevestigen.

### Vergelijking auditors

- Per auditor: aantal rapporten, aantal rapportbevindingen,
  percentage per overeenstemming.
- Matrix patroon × auditor.
- Export CSV.

## Oefenmodus

Een oefenset is een verzameling casussen (per criterium of per
bronrapport). Gedrag zoals de prototypes:

1. Kop met casus-id en titel; geen criterium of oordeel zichtbaar.
2. Testgebied in sandboxed iframe, hoogte automatisch via
   `postMessage`. Moet echt werken met toetsenbord en
   screenreader.
3. Broncode testgebied: standaard uitgeklapt, inklapbaar,
   bestandsnamen in plaats van data-URI's, regels afgebroken,
   geen horizontaal scrollen.
4. Jouw oordeel: `fieldset` + `legend`, radio's Afkeur en
   Geen afkeur. Optioneel per set: ook criterium kiezen.
5. Feedback in `role="status"`: "Goed beoordeeld" of
   "Niet goed: dit is een afkeur (1.3.1)". Groene of rode rand.
6. Bevinding: uitklapbaar, opent na kiezen. Oordeel-pill,
   bij rapportcasussen het blok "Rapport / Ons oordeel", uitleg,
   technieken, correcte code.

Bovenaan: titel, instructie, score
("12 van 23 beoordeeld · 10 goed", `aria-live="polite"`),
knoppen Alle bevindingen openen en Antwoorden wissen,
categorie-navigatie.

Nieuw ten opzichte van de prototypes:

- Antwoorden per gebruiker opgeslagen (niet `localStorage`).
  Fase 4; in fase 1 in de browser (besluit 11).
- Examenmodus: feedback pas na Inleveren.
- Gedeelde link voor externen zonder account.
- Statistiek: percentage goed per casus.

De oefenmodus zelf voldoet aan WCAG 2.2 AA. Koppen binnen
testgebieden zitten in het iframe en tellen niet mee in de
koppenstructuur van de pagina.

## Workflows

A. Rapport verwerken: toevoegen → openen → per bevinding citaat,
criterium, oordeel → koppelen of nieuw patroon → afronden.

B. Patroon vastleggen: onderbouwing → oordeel, standaardtekst,
advies → minstens één casus → status `vastgesteld`.

C. In audit: projectpagina → Bevinding toevoegen → patroon
zoeken → standaardtekst ingevoegd → pagina-URL en herkomst →
afwijking vraagt reden en komt op signaleringslijst.

D. Externe afkeur weerleggen: rapport verwerken → bij
`te-streng` of `ander-criterium` knop Reactie opstellen →
conceptantwoord met onderbouwing en link naar casus → wordt
bespreekpunt bij het project.

## Integratie met bestaande auditor

- Projectpagina `/admin/projects/:id`: blok Bevindingen met
  badge uit bibliotheek / aangepast / vrij, telling per herkomst.
- Bespreekpunten klant: knop Maak bespreekpunt vanuit een
  bevinding, met link naar patroon en casus.
- Scopeselectie: checklist van patronen met herkomst `template`.
- Export naar rapportformaat (nog te bepalen) en CSV, nooit met
  casus-HTML of vertrouwelijke brongegevens.

## Startdata

`seed-bibliotheek.json` bevat 69 patronen, 78 casussen,
5 auditors, 84 bronnen en 30 rapportbevindingen. Extra velden:

- `oefensets[]`: `{id, titel, paginaCss}`. `paginaCss` is de
  volledige CSS van de prototypepagina; gebruik de regels die
  testgebieden nodig hebben (bijv. `.fake-h`, `.grid-table`,
  `.layout`) als basisstijl in het iframe.
- `afbeeldingen`: bestandsnaam → data-URI (21 stuks). Bij import
  opslaan in de database (eigen tabel), niet als bestand: de
  database is gedeeld tussen twee computers, `public/uploads/`
  niet. In de broncode blijft de bestandsnaam staan. Zie
  besluit 12.
- `patronen[].casussen`: lijst casus-id's (afgeleid, mag
  vervallen na import).
- `bronnen[].auditorZeker`: false als de auditor alleen uit de
  bestandsnaam is afgeleid.

Lege velden die Frits later invult: `standaardTekst`, `advies`,
`omschrijving`, `citaat`. Alle patronen hebben status `concept`.

## Bouwfases

1. Bibliotheek en oefenen: datamodel, seed-import,
   patronenbibliotheek, patroondetail, casuseditor, oefenmodus.
   Toets: alle 78 casussen werken in de oefenmodus.
2. Audits uit patronen: bevinding toevoegen op projectpagina,
   afwijkingen, export, bespreekpunten.
   Toets: één echte audit volledig met bibliotheekbevindingen.
3. Externe rapporten: register, verwerken, vergelijking
   auditors, optioneel taalmodel.
   Toets: 10 externe rapporten verwerkt.
4. Delen en examens: examenmodus, gedeelde link, statistiek,
   antwoorden per gebruiker, templateveld met keuzelijst,
   template-checklist in scopeselectie. Externen zien
   alleen vastgestelde casussen.

### Acceptatiecriteria fase 1

- [ ] Seed importeert zonder fouten (69 / 78 / 5 / 84 / 30).
- [ ] Elke casus rendert in het iframe zoals in het prototype.
- [ ] Broncode toont bestandsnamen, geen data-URI's, geen
      horizontale scroll bij 320 px.
- [ ] Test: voor alle 78 casussen geeft het juiste antwoord
      "Goed beoordeeld" en het verkeerde "Niet goed"
      (bij `advies` is Geen afkeur juist, besluit 6).
- [ ] Afbeeldingen zichtbaar op beide computers
      (besluit 12).
- [ ] Oefenmodus: geen axe-fouten, koppenlijst alleen
      paginakoppen, volledig met toetsenbord te bedienen.
- [ ] Casus kan geen app-gegevens lezen (geen
      `allow-same-origin`).

### Acceptatiecriteria fase 2

- [ ] Bevinding uit vastgesteld patroon in maximaal 3 klikken.
- [ ] Afwijking zet `afwijkendVanPatroon` en vraagt reden.
- [ ] Export zonder casus-HTML en vertrouwelijke brongegevens.

### Acceptatiecriteria fase 3

- [ ] Rapport toevoegen met URL en met PDF.
- [ ] Overeenstemming klopt voor de seed (HUW-R7 →
      `ander-criterium`, HUW-R1 → `te-streng`).
- [ ] Auditorvergelijking exporteerbaar als CSV.

## Randvoorwaarden

- Bekijk eerst `wcag-regels/` en `wcag-checklists/`: als daar
  al criteria-data of werkregels staan, hergebruik die en
  maak geen tweede lijst van succescriteria.
- Casus-HTML nooit in de DOM van de app, alleen in het iframe.
- App-CSS lekt niet in het testgebied.
- Volg de bestaande code-stijl, routing en opslag van de
  Shift2-auditor.

## Besluiten fase 1 (Frits, 17 oktober 2026)

Waar deze besluiten afwijken van de tekst hierboven, gaan
de besluiten voor.

1. **Vaststellen.** Alleen Frits stelt patronen vast. Dat is
   een afspraak en geen grendel: de app heeft geen
   inlog of gebruikers. De bevestiging vraagt "Wie stelt
   dit vast?", vooraf ingevuld met "Frits", en bewaart de
   naam in `vastgesteldDoor`. Accounts en rollen komen
   pas als fase 3 (vertrouwelijke bronnen) of fase 4
   (externen) ze nodig maakt.
2. **Uitgestelde open vragen.** Exportformaat, taalmodel en
   2.1 → 2.2 blijven open tot fase 2/3; zie onderaan.
3. **Templates.** Tags blijven onderwerpen, zoals in de
   seed; geen template- of CMS-namen als tag. In fase 4
   (template-checklist) krijgt het patroon een eigen veld
   template/CMS met een vaste keuzelijst; de bestaande
   SIMsite-template-monitoring is de startlijst.
4. **Patronen naast QuickFindings.** Fase 1 bouwt Patroon
   als eigen model; QuickFindings blijven ongewijzigd.
   Vaste vraag voor fase 2: gaan QuickFindings op in
   Patronen, of haalt een patroon zijn tekst uit een
   QuickFinding? Zonder die beslissing ontstaan twee
   teksten voor dezelfde fout.
5. **Criteria.** Codes als `String[]`, gecontroleerd tegen
   `wcag_criteria` (zie Datamodel). Geen koppeltabel en
   geen tweede lijst. Later kan `rapportCriteria` bewust
   een code buiten 2.2 toelaten (4.1.1 uit een
   2.1-rapport).
6. **Advies in de oefenmodus.** Bij een `advies`-patroon is
   Geen afkeur het juiste antwoord (zoals in de
   prototypes). Feedback bij fout: "Niet goed: dit is geen
   afkeur op 1.3.1 (wel een advies)". De oordeel-pill toont
   "Advies".
7. **Concept en twijfel in de oefenmodus.** Casussen van
   `concept`-patronen worden getoond, met het label
   "voorlopig oordeel" in de bevinding; bovenaan staat
   hoeveel casussen voorlopig zijn. Casussen van
   `twijfel`-patronen komen niet in de oefenmodus en tellen
   niet mee in de score; de casuseditor meldt dat. Vanaf
   fase 4 zien externen alleen vastgestelde casussen.
8. **Regelbestand is leidend.** Een patroon mag pas naar
   `vastgesteld` als het niet botst met het regelbestand in
   `wcag-regels/` van zijn criterium; bij een botsing past
   Frits eerst een van beide aan. De import neemt de seed
   letterlijk over. Claude levert eenmalig een los
   overzicht per patroon (klopt met regel / botst met regel
   / geen regel), zonder iets te wijzigen. Geen
   automatische controle in de app. De bibliotheek past de
   regelbestanden nooit aan.
9. **Database.** Backup is altijd de eerste stap, niet "of
   een branch": een branch scheidt code, niet de gedeelde
   Neon-database. Volgorde: Frits draait `npm run backup`
   (Claude controleert dat de CSV's rijen hebben) → Claude
   schrijft schema en migratie, na de vraag of de
   dev-server gestopt is → Frits draait
   `npm run schema:update`, bij voorkeur aan het begin van
   de dag → daarna pas het seed-script. Op de tweede
   computer na `git pull` ook `npm run schema:update`.
10. **Branch en commits.** Eigen branch
    `claude/bibliotheek-fase-1`. Eerste commit:
    `docs/bibliotheek/`. Daarna één commit per stap, met
    alleen de bestanden van die stap (nooit `git add .`).
    Bestaande niet-gecommitte wijzigingen op de werkmap
    zijn van Frits en blijven onaangeroerd. Geen push of PR
    zonder vraag.
11. **Antwoorden in de oefenmodus.** In fase 1 in de eigen
    browser, zoals de prototypes. Per gebruiker in de
    database schuift door naar fase 4, samen met gedeelde
    link en statistiek: alle drie hebben nodig dat de app
    weet wie er oefent.
12. **Afbeeldingen.** In de database, geserveerd via een
    vast adres (bijv.
    `/api/bibliotheek/afbeelding/<naam>`), ook uploads uit
    de casuseditor. Zo ziet elke computer hetzelfde.
13. **Klantdata-waarschuwing.** Alleen bij een e-mailadres
    (niet `voorbeeld.nl`, `example.com`), een
    telefoonnummer (niet het 14-nummer `14 0xx` of
    verzonnen reeksen) en een URL op het domein van een
    onderzoek in de app, met de naam van dat onderzoek
    erbij. Waarschuwing, geen blokkade. `waterdam.nl`
    (HUW-R6) is verzonnen.

Technische keuzes die hieruit volgen (niet van Frits, wel
door hem gezien):

- Code-editor: CodeMirror 6.
- Oefensets krijgen een eigen tabel (id, titel,
  basis-CSS uit `paginaCss`).
- Extra seedvelden gaan mee: `rapportSamenvatting`,
  `shift2Samenvatting`, `auditorZeker`.
- `Bron.datum` blijft tekst (`jul 2026`); 42 van 84 leeg.
- Op de tab In rapporten toont een vertrouwelijke bron
  nooit de organisatie.
- Tests met de bestaande opzet: `tsx --test`, Puppeteer,
  axe-core.

## Open vragen (aan Frits voorleggen, niet zelf invullen)

Beantwoord op 17 oktober 2026, zie Besluiten fase 1:

- Wie mag patronen vaststellen? → besluit 1.
- Welke SIMsite/Drupal-templates als tag? → geen tags;
  eigen veld in fase 4 (besluit 3).

Open, nodig vanaf fase 2/3:

- Rapportformaat voor export (Word, PDF, HTML)? (fase 2)
- Gaan QuickFindings op in Patronen, of verwijst een
  patroon naar een QuickFinding? (fase 2, besluit 4)
- Mag een taalmodel vertrouwelijke klantrapporten lezen?
  (fase 3)
- Gelden patronen uit 2.1-rapporten automatisch voor 2.2?
  (fase 3) Kanttekening: een patroon dat alleen op 4.1.1
  steunt kan dat nooit, want 4.1.1 is in 2.2 geschrapt. In
  de seed zit er geen; alle 69 staan op 2.1 en 2.2.
- Welke templates in de keuzelijst van het templateveld?
  (fase 4, besluit 3)
