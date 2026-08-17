export const meta = {
  name: 'audit-samples',
  description: 'Per sample: audit alle succescriteria van het onderzoekstype met de Shift2-beoordelingsregels en de checklists, verifieer, match tegen bestaande QuickFindings, en schrijf de uitkomsten weg als voorstel',
  whenToUse: 'Voor een WCAG-audit waarbij per sample elk succescriterium moet worden beoordeeld zonder dat er criteria worden overgeslagen. Werkt op HTML-pagina\'s en op PDF-documenten (die krijgen een eigen beoordeling op documentstructuur). Schrijft het oordeel per sample per criterium weg en maakt de afkeuringen aan als voorstel — die tellen nergens mee tot de onderzoeker akkoord geeft. Levert daarnaast een lijst met vragen die handmatig in de browser beantwoord moeten worden. Draai met args.drooglopen = true om alleen te rapporteren.',
  phases: [
    { title: 'Voorbereiden', detail: 'Project, samples, SC-set en QuickFindings ophalen' },
    { title: 'Auditen', detail: 'Eén auditor-agent per sample gaat alle SC\'s af (Shift2-regels + wcag-checklists)' },
    { title: 'Verifiëren', detail: 'Verifier-agent controleert de afkeuringen per sample' },
    { title: 'QuickFinding-match', detail: 'Per afkeuring: bestaat er al een passende QuickFinding?' },
    { title: 'Wegschrijven', detail: 'Sampleoordelen opslaan en afkeuringen aanmaken als voorstel' },
  ],
}

// args: { projectId: string, criteria?: string[], maxSamples?: number }
// Defensief: args kan als object OF als JSON-string binnenkomen.
let opts = args
if (typeof opts === 'string') {
  try {
    opts = JSON.parse(opts)
  } catch {
    opts = { projectId: opts }
  }
}
opts = opts || {}
const projectId = opts.projectId
if (!projectId) {
  throw new Error('args.projectId is verplicht. Roep aan met args: { projectId: "..." }')
}

// ---------------------------------------------------------------------------
// FASE 1 — Voorbereiden. Alle read-only data via één "scout"-agent die de
// audit-CLI aanroept (de CLI praat met de draaiende dev server).
// ---------------------------------------------------------------------------
phase('Voorbereiden')

const CONTEXT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['researchTypeName', 'samples', 'criteria', 'quickFindingsPad', 'aantalQuickFindings', 'existingFindings'],
  properties: {
    researchTypeName: { type: 'string' },
    samples: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // description staat er bewust in als VERPLICHT veld met null toegestaan. Een
        // optioneel veld laat een agent graag weg, en juist daar staat wat er
        // bijzonder is aan een pagina — dat een stap van een formulier alleen via een
        // ingevulde vorige stap te bereiken is, bijvoorbeeld. Zo moet hij er actief
        // null van maken in plaats van hem stilzwijgend te laten vallen.
        required: ['id', 'title', 'url', 'sampleType', 'description'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: ['string', 'null'] },
          sampleType: { type: 'string' },
          description: { type: ['string', 'null'] },
        },
      },
    },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'code', 'level', 'titleNl'],
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          level: { type: 'string' },
          titleNl: { type: 'string' },
        },
      },
    },
    // Pad naar het weggeschreven JSON-bestand met de QuickFinding-bibliotheek.
    // Bewust NIET de inhoud zelf: die is ~45KB en overtypen kost de scout minuten.
    // De match-agent leest het bestand zelf en filtert op criteriumcode.
    quickFindingsPad: { type: 'string' },
    aantalQuickFindings: { type: 'number' },
    // De SC-codes waarvoor in wcag-regels/ een Shift2_Regels-bestand staat, en de
    // codes met een grensgevallen-bestand in wcag-checklists/. Uitgelezen in
    // plaats van vast in dit script, zodat een nieuwe regel meteen meetelt.
    regelbestanden: { type: 'array', items: { type: 'string' } },
    grensgevallen: { type: 'array', items: { type: 'string' } },
    // Bestaande bevindingen in het project — puur om in het eindrapport
    // afkeuringen te labelen als 'nieuw' of 'bestaat_al'. De auditors zien
    // deze NIET (verse audit).
    existingFindings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['findingCode', 'criterion', 'sampleItemIds', 'description'],
        properties: {
          findingCode: { type: 'string' },
          criterion: { type: 'string' },
          sampleItemIds: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
        },
      },
    },
    // Eerder afgewezen voorstellen. Deze worden de auditors WEL getoond, anders
    // dan de bevindingen. Een afwijzing is negatieve kennis — "hier hebben we
    // naar gekeken en besloten dat het geen bevinding is, omdat X" — en die lokt
    // geen napraten uit; ze voorkomt juist dat dezelfde discussie elke ronde
    // terugkomt. Zie docs/adr/0001-akkoord-als-poort.md.
    afwijzingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterion', 'reden'],
        properties: {
          criterion: { type: 'string' },
          reden: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
}

const overrideCriteria = Array.isArray(opts.criteria) && opts.criteria.length
  ? `\n\nBELANGRIJK: gebruik UITSLUITEND deze SC-codes als criteria-set: ${opts.criteria.join(', ')}.`
  : ''

const context = await agent(
  `Je bent de scout voor een WCAG-audit-workflow. Verzamel read-only context via de audit-CLI (\`npm run cli -- <command>\`). De dev server draait al.

Project-id: ${projectId}

Doe het volgende, in deze volgorde, en geef ALLE gevonden data terug in het schema:

1. \`npm run cli -- get-project ${projectId}\` — noteer project.researchType (de naam van het onderzoekstype) en de volledige lijst sampleItems (id, title, url, sampleType, description). Neem ALLE sample-items op, en neem de description letterlijk over — daar staat wat er bijzonder is aan een pagina, bijvoorbeeld dat hij alleen via een ingevuld formulier te bereiken is.

2. Haal de SC-set van het onderzoekstype op met een GET naar de API. De research-type-route accepteert de NAAM:
   \`curl -s "http://localhost:3000/api/research-types/<researchTypeName-url-encoded>"\`
   In de response zit \`criteria[]\`, elk met \`wcagCriterion\` (velden: id, code, level, titleNl). Vlak dit uit naar de criteria-array in het schema. Neem ALLE gekoppelde criteria op — sla er geen over.
   Kun je de research-type niet vinden op naam, val dan terug op \`npm run cli -- list-criteria\` en neem alle A+AA-criteria.${overrideCriteria}

3. De QuickFinding-bibliotheek. TYP DEZE NIET OVER — schrijf hem naar een bestand en geef alleen het pad terug:
   \`\`\`
   curl -s "http://localhost:3000/api/quick-findings" | node -e "
   let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
     const j=JSON.parse(s);
     const slim=(Array.isArray(j)?j:j.quickFindings||[]).map(q=>({
       id:q.id, title:q.title,
       criterionCode:q.criterion?.code||q.criterionCode||null,
       description:(q.description||'').slice(0,200)
     }));
     require('fs').writeFileSync('tmp/qf-bibliotheek.json',JSON.stringify(slim,null,1));
     console.log(slim.length);
   })"
   \`\`\`
   Maak de map \`tmp/\` zo nodig eerst aan. Geef in het schema \`quickFindingsPad\` = "tmp/qf-bibliotheek.json" en \`aantalQuickFindings\` = het getal dat het commando print. Controleer dat het bestand bestaat en dat het aantal klopt; de inhoud hoef je niet te lezen of terug te geven.

4. \`curl -s "http://localhost:3000/api/projects/${projectId}/findings"\` — de BESTAANDE bevindingen. Splits die response in tweeën:

   a) \`existingFindings\`: alles met status 'open', 'published', 'resolved' EN 'voorstel'. Geef per stuk terug: findingCode, criterion (de code, bv. "1.3.1"), sampleItemIds (de id's uit occurrences[].sampleItem.id of occurrences[].sampleItemId), en de eerste ~150 tekens van description. Deze worden NIET aan de auditors getoond; ze dienen alleen om later te labelen wat nieuw is.
      Voorstellen horen hier nadrukkelijk bij: die wachten nog op akkoord, maar ze bestaan al. Laat je ze weg, dan stelt een tweede run dezelfde vondst nog een keer voor en krijgt de onderzoeker twee bijna gelijke voorstellen op zijn stapel.

   b) \`afwijzingen\`: alles met status 'afgewezen'. Geef per stuk terug: criterion (de code), reden (het veld \`afwijzingsreden\`) en de eerste ~120 tekens van description. Deze worden de auditors WEL getoond, zodat ze een eerder verworpen vondst niet opnieuw voorstellen. Sla er een over als \`afwijzingsreden\` leeg is; zonder reden valt er niets van te leren.

5. Welke Shift2-regelbestanden en grensgevallen-bestanden er zijn. Lees de mappen uit; typ geen lijst uit je hoofd over:
   \`\`\`
   ls wcag-regels/ | grep '^Shift2_Regels_SC_'
   ls wcag-checklists/ | grep '^Richtlijnen_Grensgevallen_SC_'
   \`\`\`
   Zet de SC-codes in \`regelbestanden\` respectievelijk \`grensgevallen\`, met punten in plaats van underscores: \`Shift2_Regels_SC_3_3_2.md\` wordt "3.3.2". Neem ALLE gevonden bestanden op — deze lijst bepaalt waar de auditors naar verwezen worden, en een regel die hier ontbreekt wordt door niemand gelezen.

Geef puur de verzamelde data terug. Verzin niets; laat een lege array als iets niet bestaat.`,
  { label: 'scout:context', phase: 'Voorbereiden', schema: CONTEXT_SCHEMA },
)

if (!context || !context.samples.length) {
  return { error: 'Geen sample-items gevonden voor dit project.', context }
}
if (!context.criteria.length) {
  return { error: 'Geen succescriteria gevonden (onderzoekstype leeg?).', context }
}
// De QuickFinding-match leest het bestand zelf. Ontbreekt het of is het leeg, dan
// zou die fase stilletjes 'geen match' teruggeven en zouden we duplicaten aanmaken.
if (!context.quickFindingsPad || !context.aantalQuickFindings) {
  log(`LET OP: geen QuickFinding-bibliotheek (pad=${context.quickFindingsPad || 'leeg'}, aantal=${context.aantalQuickFindings || 0}). De match-fase kan geen duplicaten herkennen; controleer de voorstellen zelf tegen de bibliotheek.`)
}

// Samples splitsen in HTML-pagina's en PDF-documenten. Beide worden geauditeerd, maar met
// een eigen prompt: een PDF beoordeel je op de documentstructuur (tags, titel, taal), niet
// op DOM en screenshot.
const isPdfSample = (s) =>
  typeof s.url === 'string' &&
  /^https?:\/\//i.test(s.url) &&
  (s.sampleType === 'pdf' || /\.pdf(\?|#|$)/i.test(s.url))

const htmlSamples = context.samples.filter(
  (s) =>
    typeof s.url === 'string' &&
    /^https?:\/\//i.test(s.url) &&
    s.sampleType !== 'pdf' &&
    !/\.pdf(\?|#|$)/i.test(s.url),
)
const pdfSamples = context.samples.filter(isPdfSample)
// Wat overblijft heeft geen bruikbare URL en kan niet opgehaald worden.
const overgeslagen = context.samples.filter(
  (s) => !htmlSamples.includes(s) && !pdfSamples.includes(s),
)

// Index van bestaande bevindingen per sampleId → set van criteriumcodes, zodat we
// straks 'nieuw' vs 'bestaat_al' kunnen labelen (verse audit — de auditors zien
// dit niet). Voorstellen tellen hier mee: die wachten nog op akkoord, maar ze
// bestaan al, en zonder hen stelt een tweede run dezelfde vondst opnieuw voor.
const bestaandeIndex = new Map() // sampleId -> Map(code -> findingCode)
for (const f of context.existingFindings || []) {
  for (const sid of f.sampleItemIds || []) {
    if (!bestaandeIndex.has(sid)) bestaandeIndex.set(sid, new Map())
    bestaandeIndex.get(sid).set(f.criterion, f.findingCode)
  }
}

const alleAuditbaar = [...htmlSamples, ...pdfSamples]
if (!alleAuditbaar.length) {
  return { error: 'Geen samples met een bruikbare http(s)-URL om te auditen.', overgeslagen }
}

// Sample-selectie:
//   opts.sampleIds      — alleen deze sample-id's auditen (heeft voorrang)
//   opts.skipSampleIds  — deze overslaan, bv. samples die al zijn afgerond
//   opts.maxSamples     — testlimiet: alleen de eerste N
// Let op: het homepage-sample wordt hieronder apart bepaald uit ALLE html-samples, ook als
// het zelf niet geauditeerd wordt. De auditor moet immers weten of hij op de homepage zit.
let teAuditen = alleAuditbaar
if (Array.isArray(opts.sampleIds) && opts.sampleIds.length) {
  const wil = new Set(opts.sampleIds)
  teAuditen = alleAuditbaar.filter((s) => wil.has(s.id))
  const nietGevonden = opts.sampleIds.filter((id) => !alleAuditbaar.some((s) => s.id === id))
  if (nietGevonden.length) log(`LET OP: ${nietGevonden.length} opgegeven sample-id(s) niet gevonden of zonder bruikbare URL: ${nietGevonden.join(', ')}`)
}
if (Array.isArray(opts.skipSampleIds) && opts.skipSampleIds.length) {
  const skip = new Set(opts.skipSampleIds)
  const voor = teAuditen.length
  teAuditen = teAuditen.filter((s) => !skip.has(s.id))
  log(`${voor - teAuditen.length} sample(s) overgeslagen op verzoek.`)
}
if (Number.isInteger(opts.maxSamples) && opts.maxSamples > 0) {
  teAuditen = teAuditen.slice(0, opts.maxSamples)
}
if (!teAuditen.length) {
  return { error: 'Geen samples over om te auditen na filtering.', beschikbaar: alleAuditbaar.map((s) => ({ id: s.id, title: s.title })) }
}

// Welk sample is de homepage? Alleen daar worden header en footer beoordeeld; op alle
// andere samples kijkt de auditor uitsluitend naar de main-content. Zonder dit zou elk
// sitebreed footer-issue op elke pagina opnieuw als 'nieuw' worden gerapporteerd.
// Herkenning: titel "Homepage"/"Home", of een URL die alleen uit het domein bestaat.
// opts.homepageSampleId overschrijft de detectie als die ernaast zit.
const isHomepage = (s) => {
  if (opts.homepageSampleId) return s.id === opts.homepageSampleId
  if (/^\s*home(page)?\s*(\||$)/i.test(s.title || '')) return true
  try {
    const u = new URL(s.url)
    return u.pathname === '/' || u.pathname === ''
  } catch {
    return false
  }
}
const homepageSample = htmlSamples.find(isHomepage) || null
if (!homepageSample) {
  log(`LET OP: geen homepage-sample herkend. Alle samples worden inclusief header en footer beoordeeld, wat sitebrede bevindingen kan dupliceren. Geef eventueel args.homepageSampleId mee.`)
} else {
  log(`Homepage-sample: "${homepageSample.title}". Daar worden header, main en footer beoordeeld; bij de overige samples alleen de main-content.`)
}

const aantalPdfTeAuditen = teAuditen.filter(isPdfSample).length
log(`${teAuditen.length} samples te auditen (${teAuditen.length - aantalPdfTeAuditen} HTML, ${aantalPdfTeAuditen} PDF) × ${context.criteria.length} criteria (onderzoekstype: ${context.researchTypeName}). ${overgeslagen.length} samples zonder bruikbare URL overgeslagen. ${context.existingFindings?.length || 0} bestaande bevindingen als referentie. QuickFinding-bibliotheek: ${context.aantalQuickFindings || 0} stuks in ${context.quickFindingsPad || '(geen pad)'}.`)

// ---------------------------------------------------------------------------
// SC-MANIFEST — welke criteria een browsertest vereisen, en met welke vraag.
//
// De inhoudelijke beoordelingsregels staan NIET hier maar in de repo:
//   wcag-regels/Shift2_Regels_SC_<code>.md
// De auditor-agents lezen die zelf tijdens de run (zij hebben wel filesystem-
// toegang; dit script niet). Regels wijzigen = alleen dat markdown-bestand aanpassen.
//
// Wat hier staat, heeft het script zelf nodig vóór de agents draaien: de vlag om
// interactieve criteria deterministisch op 'niet_te_bepalen' te zetten, en de
// vraagtekst voor de gebundelde vragenlijst aan het eind.
// ---------------------------------------------------------------------------
const INTERACTIEVE_SC = {}

// Deze tabel is LEEG en dat is bewust: er is geen enkel criterium meer dat standaard, zonder
// onderzoek, op 'niet_te_bepalen' gaat. Elk criterium dat hier ooit in stond is nu zelf te
// meten in de audit-sessie-Chrome:
//
//   2.1.2  — Tab versturen en document.activeElement uitlezen
//   1.4.10 — viewport op exact 320 CSS-pixels, scrollWidth vergelijken
//   1.4.3 en 1.4.11 — pixelmeting op de hoogcontrastknop. Die knop staat in de HEADER en is
//            op elke pagina dezelfde: één meting op het homepage-sample, niet twaalf keer.
//   1.2.3 en 1.2.5 — apart audiospoor uitlezen (adaptiveFormats met audioTrack), transcript-
//            knop zoeken, en via de open ondertiteling nagaan of de tekst in beeld ook
//            gesproken wordt. Bij 1.2.3 pas een vraag als er géén ondertiteling is; bij 1.2.5
//            bepaalt de ruimte-vraag alleen de vorm van het advies, niet of er een bevinding is.
//
// Lukt een meting niet, dan zet de auditor het criterium zelf op 'niet_te_bepalen' met de
// concrete vraag én de reden waarom het niet lukte.
//
// De tabel blijft bestaan omdat de structuur eromheen (deterministisch overschrijven, vragen
// bundelen) nog gebruikt wordt zodra er een nieuw interactief criterium bij komt.
// Zie wcag-regels/Shift2_Regels_SC_1_4_3.md, _1_4_11.md, _2_1_2.md, _1_4_10.md, _1_2_3.md,
// _1_2_5.md, Shift2_Werkwijze_Video.md en Shift2_Scope_Per_Sample.md.

/**
 * Criteria waarvoor een Shift2_Regels-bestand bestaat, zoals de scout ze in
 * wcag-regels/ heeft aangetroffen.
 *
 * Dit stond eerder als vaste lijst in dit script. Dat is een stille val: schrijf
 * je een nieuwe regel en vergeet je de code hier toe te voegen, dan lezen de
 * agents hem nooit en merk je dat niet — het oordeel ziet er gewoon uit. Het
 * script zelf kan de map niet uitlezen (geen bestandssysteem), dus de scout doet
 * het en geeft de lijst terug. De vaste lijst blijft als terugval, voor het geval
 * de scout er niet bij kan.
 */
const REGELS_TERUGVAL = [
  '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.3.1', '1.3.2', '1.3.3', '1.3.5',
  '1.4.1', '1.4.3', '1.4.5', '1.4.10', '1.4.11', '2.1.2', '2.4.4', '2.4.6', '2.5.3', '2.5.8',
  '3.2.4', '4.1.2',
]
const SC_MET_REGELBESTAND = Array.isArray(context.regelbestanden) && context.regelbestanden.length
  ? context.regelbestanden
  : REGELS_TERUGVAL

// Vaste, gesorteerde SC-lijst die aan ELKE auditor wordt meegegeven.
const scList = context.criteria
  .map((c) => `${c.code} (niveau ${c.level}) — ${c.titleNl}`)
  .join('\n')
const requiredCodes = context.criteria.map((c) => c.code)

// De SC's die niet uit HTML/screenshot te bepalen zijn.
const interactieveCodes = requiredCodes.filter((code) => INTERACTIEVE_SC[code])

// Per criterium de te lezen bronbestanden. De agents lezen ze zelf met hun Read-tool;
// samen zijn ze honderden KB's, dus inplakken kan niet en is ook niet nodig.
// Grensgevallen-bestanden bestaan alleen voor een handvol SC's.
const GRENSGEVALLEN =
  Array.isArray(context.grensgevallen) && context.grensgevallen.length
    ? context.grensgevallen
    : ['1.1.1', '1.3.1', '2.4.4', '2.4.6']
const slug = (code) => code.replace(/\./g, '_')
const bronnenLijst = requiredCodes
  .map((code) => {
    const regels = SC_MET_REGELBESTAND.includes(code)
      ? `wcag-regels/Shift2_Regels_SC_${slug(code)}.md`
      : '(geen Shift2-regelbestand)'
    const grens = GRENSGEVALLEN.includes(code)
      ? `, wcag-checklists/Richtlijnen_Grensgevallen_SC_${slug(code)}.md`
      : ''
    return `  ${code}\n      wcag-checklists/Checklist_SC_${slug(code)}.md${grens}\n      ${regels}`
  })
  .join('\n')

const bronnenSectie = `\n\nBRONNEN — VERPLICHT LEZEN VOOR ELK CRITERIUM
Beoordeel niet uit je hoofd. Lees per criterium dat je beoordeelt eerst de bijbehorende
bestanden uit de repo met je Read-tool (je werkdirectory is de repo-root).

Volgorde per criterium:
  1. \`wcag-checklists/Checklist_SC_<code>.md\` — de toetsingsinstructie: definitie, beslisboom, auditgebieden, voorbeelden
  2. \`wcag-checklists/Richtlijnen_Grensgevallen_SC_<code>.md\` — als die bestaat, voor de randgevallen
  3. \`wcag-regels/Shift2_Regels_SC_<code>.md\` — de vastgelegde Shift2-voorkeuren. DEZE ZIJN BINDEND en gaan vóór de checklist en vóór je eigen WCAG-interpretatie als ze elkaar tegenspreken.

Lees eenmalig, vóór je begint:
  - \`wcag-regels/Shift2_Scope_Per_Sample.md\` — VERPLICHT. Welk deel van de pagina je beoordeelt (header/main/footer) en waarom.
  - \`wcag-regels/Shift2_Bewijsvoering.md\` — VERPLICHT. Waarop een oordeel mag rusten en wat je als bewijs meelevert. Begin er ook mee: dat bestand schrijft voor dat je elk sample opent met de pagina zonder opmaak, en dat je eerst controleert of je wel op de gevraagde pagina bent uitgekomen.
  - \`wcag-regels/Shift2_Voldoet_Of_Niet_Aanwezig.md\` — VERPLICHT. Wanneer een criterium gehaald is en wanneer het niet van toepassing is. Dat verschil gaat vaak mis in beide richtingen.
  - \`wcag-regels/Shift2_Schrijfregels.md\` — VERPLICHT. De schrijfregels voor elke bevinding: structuur, toon, terminologie, wat je niet doet. Bindend, ook waar ze afwijken van de projectinstructie.
  - \`wcag-checklists/Project_Instructie_WCAG_Audit.md\` — werkwijze en bevindingformat
  - \`wcag-checklists/Voorbeelden_Bevindingen.md\` — schrijfstijl en toon
  - \`wcag-regels/README.md\` — hoe de regels zich tot de checklists verhouden

Staat er een video op de pagina (een \`iframe\` met een YouTube- of Vimeo-speler, of een
\`video\`-element in de main-content), lees dan ook:
  - \`wcag-regels/Shift2_Werkwijze_Video.md\` — hoe je 1.2.1 t/m 1.2.5 onderzoekt. Twee dingen
    die je zelf moet uitzoeken in plaats van vragen:
      * OPEN ondertiteling zit in het beeld gebrand en staat niet in de speler-API. Concludeer
        nooit "geen ondertiteling" op basis van de API alleen; scan eerst frames.
      * Of tekst in beeld ook wordt UITGESPROKEN lees je af uit diezelfde open ondertiteling:
        staat er een naambalkje terwijl de ondertiteling iets heel anders zegt, dan wordt de
        naam niet uitgesproken. Vraag dat dus niet aan de onderzoeker. Alleen bij een video
        zonder ondertiteling én zonder transcript blijft die vraag over.

Bestanden voor deze audit:
${bronnenLijst}

Bestaat een bestand niet, beoordeel dan op de WCAG-tekst en vermeld dat in 'reden'.
Het Shift2-regelbestand bevat precies de correcties die eerder op audits zijn gegeven: hoe een randgeval beoordeeld hoort te worden, welke formuleringen vastliggen en wanneer iets juist GEEN bevinding is. Sla het niet over.\n`

// Eerder afgewezen voorstellen, gegroepeerd per criterium. Dit is het enige wat
// de auditors van vorige rondes te zien krijgen: geen bevindingen (die zouden ze
// napraten in plaats van opnieuw kijken), wel de oordelen die de onderzoeker
// heeft verworpen en waarom.
const afwijzingenPerCode = new Map()
for (const a of context.afwijzingen || []) {
  if (!a.criterion || !a.reden) continue
  if (!afwijzingenPerCode.has(a.criterion)) afwijzingenPerCode.set(a.criterion, [])
  afwijzingenPerCode.get(a.criterion).push(a)
}

const afwijzingenSectie = afwijzingenPerCode.size
  ? `\n\nEERDER AFGEWEZEN OP DIT PROJECT — ${afwijzingenPerCode.size} criteria
De onderzoeker heeft deze vondsten al eens beoordeeld en verworpen. Stel ze niet opnieuw voor tenzij je iets ziet dat wezenlijk anders is dan wat hier staat; leg in dat geval in 'reden' uit waarin het verschilt.
${[...afwijzingenPerCode.entries()]
  .map(
    ([code, lijst]) =>
      `  ${code}:\n${lijst.map((a) => `    - afgewezen omdat: ${a.reden}${a.description ? ` (ging over: ${a.description})` : ''}`).join('\n')}`,
  )
  .join('\n')}\n`
  : ''

const interactieveSectie = interactieveCodes.length
  ? `\n\nINTERACTIEVE CRITERIA — ${interactieveCodes.join(', ')}
Deze zijn NIET uit HTML of screenshot te bepalen. Zet ze ALTIJD op 'niet_te_bepalen', ook als de pagina er goed uitziet.
Verzin geen oordeel en schrijf niet "lijkt in orde". Zet in 'reden' de concrete vraag die de onderzoeker in de browser moet beantwoorden; het regelbestand van het criterium bevat de standaardvraag.
Uitzondering: is het criterium aantoonbaar niet van toepassing op deze pagina (bv. geen video aanwezig voor 1.2.3/1.2.5), zet dan 'niet_aanwezig'.\n`
  : ''

log(`${requiredCodes.filter((c) => SC_MET_REGELBESTAND.includes(c)).length} van ${requiredCodes.length} criteria hebben een Shift2-regelbestand. ${interactieveCodes.length} interactief: ${interactieveCodes.join(', ') || 'geen'}.`)

// ---------------------------------------------------------------------------
// Schema's voor audit + verificatie
// ---------------------------------------------------------------------------
const STATUS_ENUM = ['voldoet', 'afgekeurd', 'opmerking', 'niet_aanwezig', 'niet_te_bepalen']

const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sampleId', 'assessments'],
  properties: {
    sampleId: { type: 'string' },
    assessments: {
      type: 'array',
      // Verplicht: precies zoveel entries als er criteria zijn. Zo kan geen SC
      // stilletjes worden overgeslagen — te weinig entries → schema-fail → retry.
      minItems: requiredCodes.length,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'status', 'reden'],
        properties: {
          code: { type: 'string', enum: requiredCodes },
          status: { type: 'string', enum: STATUS_ENUM },
          reden: { type: 'string' },
          /**
           * Alleen invullen bij 'afgekeurd' of 'opmerking'. Een lijst, want één
           * criterium kan op één pagina meerdere losse punten opleveren — de
           * Shift2-regels schrijven dat soms zelfs voor. Bij 2.4.4 op de homepage
           * bijvoorbeeld: de sociale-media-links missen de organisatienaam
           * (afkeuring), én het eerste icoon toont het X-logo terwijl de naam nog
           * "twitter" zegt (opmerking). Met één voorstel per criterium moest de
           * auditor het tweede punt in de reden kwijt, waar niemand het oppakt.
           */
          voorstellen: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'description', 'advice'],
              properties: {
                type: { type: 'string', enum: ['bevinding', 'opmerking'] },
                description: { type: 'string' },
                advice: { type: 'string' },
                impact: { type: 'string' },
                responsibility: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sampleId', 'oordelen'],
  properties: {
    sampleId: { type: 'string' },
    oordelen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'bevestigd', 'toelichting', 'bewijsvoering'],
        properties: {
          code: { type: 'string' },
          bevestigd: { type: 'boolean' },
          toelichting: { type: 'string' },
          // Optionele correctie op status als de verifier het oneens is.
          gecorrigeerdeStatus: { type: 'string', enum: STATUS_ENUM },
          /**
           * De punten uit wcag-regels/Shift2_Bewijsvoering.md, elk met een uitkomst.
           *
           * Verplicht en minstens één, zodat er niet stilzwijgend nul punten worden
           * nagelopen: een lege lijst is niet te onderscheiden van "alles in orde",
           * en dat is precies het verschil dat dit hele veld moet vastleggen.
           *
           * Een 'nee' hier betekent niet dat het oordeel fout is, maar dat de
           * onderbouwing het niet draagt. Dat mag naast een terecht oordeel staan.
           */
          bewijsvoering: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['punt', 'uitkomst'],
              properties: {
                punt: { type: 'string' },
                uitkomst: { type: 'string', enum: ['ja', 'nee', 'nvt'] },
                toelichting: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}

const QF_MATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['matches'],
  properties: {
    matches: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'bestaatAl', 'toelichting'],
        properties: {
          code: { type: 'string' },
          bestaatAl: { type: 'boolean' },
          quickFindingId: { type: ['string', 'null'] },
          quickFindingTitle: { type: ['string', 'null'] },
          toelichting: { type: 'string' },
        },
      },
    },
  },
}

// ---------------------------------------------------------------------------
// PDF-AUDITPROMPT
//
// Een PDF beoordeel je niet op DOM en screenshot maar op de documentstructuur. De
// kernvraag is of het document getagd is: zonder tags bestaat er geen structuur om te
// toetsen en vervalt een reeks criteria (zie wcag-regels/Shift2_Regels_SC_1_3_1.md).
// De agent stelt dat zelf vast met pdf-lib of PyMuPDF; PAC-output is daarvoor niet nodig.
// ---------------------------------------------------------------------------
const pdfPrompt = (sample) => `Je bent WCAG-auditor en beoordeelt ÉÉN PDF-document tegen ELK van de onderstaande succescriteria. Sla NIETS over: geef voor elk criterium een status.

SAMPLE
  id:    ${sample.id}
  titel: ${sample.title}
  url:   ${sample.url}
  type:  PDF-document

STAP 1 — HAAL HET DOCUMENT OP EN LEES DE STRUCTUUR UIT
Download het bestand naar tmp/pdf/ en bepaal machinaal:
  - Is het document GETAGD? Kijk of de catalog een /StructTreeRoot heeft en of /MarkInfo met
    /Marked true aanwezig is. Controleer ter bevestiging of die sleutels überhaupt in het
    bestand voorkomen.
  - Documenttitel: staat er een /Title in de Info-dictionary? En staat /DisplayDocTitle op
    true in /ViewerPreferences? Ontbreekt dat laatste, dan toont de viewer de bestandsnaam.
  - Taal: staat /Lang in de catalog?
  - PDF/UA-vlag in de XMP-metadata.
  - Aantal pagina's, aantal afbeeldingen, aanwezigheid van een tekstlaag.

Gebruik hiervoor Python met PyMuPDF (\`import fitz\`) of Node met pdf-lib. Beide zijn
beschikbaar. Voorbeelden staan in tmp/pdfcheck.mjs en tmp/pdf_render.py.

LET OP bij het uitlezen van de metadata: een PDF bevat ook de metadata van elk INGEBED
object (afbeeldingen, kleurprofielen). Een grep over de ruwe bytes vindt daardoor titels die
niet de documenttitel zijn. Volg altijd de objectverwijzing vanuit de catalog.

STAP 2 — BEKIJK DE PAGINA'S
Render de pagina's naar afbeeldingen en bekijk ze. Sommige beoordelingen kun je alleen op
beeld doen.

STAP 3 — BEOORDEEL

IS HET DOCUMENT NIET GETAGD, dan geldt dit dwingend (zie Shift2_Regels_SC_1_3_1.md):
  - 1.3.1 → AFGEKEURD. De ontbrekende tagstructuur is de wortel-oorzaak.
  - 1.1.1 → OPMERKING (status 'opmerking'), geen afkeuring. Zonder tags kun je niet
    vaststellen wat er aan tekstalternatieven ontbreekt.
  - 1.3.2 leesvolgorde → 'niet_te_bepalen'. Er is geen programmatische leesvolgorde.
  - 1.4.5 afbeeldingen van tekst → 'niet_te_bepalen'. Zonder tags is er voor hulptechnologie
    geen onderscheid tussen tekst en afbeelding. Dat jij de tekst in een afbeelding kunt
    uitsnijden en lezen, maakt het nog geen zelfstandig oordeel.
  - 3.2.4 consistente identificatie → 'niet_te_bepalen'. Zonder tags zijn er geen
    programmatisch herkenbare onderdelen waarvan de identificatie te vergelijken valt.
  Keur deze vier dus NIET apart af als gevolg van dezelfde oorzaak, en vul er ook nooit
  'voldoet' bij in.

MAAR: deze criteria beoordeel je bij een ongetagd document WEL gewoon. Ze gaan over wat je ZIET
en LEEST, en dat staat er ook zonder tags. Geef er een echt oordeel over (voldoet of afgekeurd);
zet ze niet op 'niet_te_bepalen' met "geen tags" als reden:
  - 2.4.4 linkdoel → lees of de tekst van een link of webadres duidelijk maakt waar hij heen
    leidt. "Klik hier" of "lees meer" zonder context is ook in een PDF een afkeuring. Wat je
    hier NIET beoordeelt: dat de link niet klikbaar is; dat valt onder 1.3.1.
  - 2.4.6 koppen en labels → kijk of de koppen boven de paragrafen de lading dekken van wat
    eronder staat. Dat de kop technisch niet als kop is vastgelegd, is een 1.3.1-kwestie.
  - 1.4.1 gebruik van kleur → is kleur de enige manier waarop informatie wordt overgedragen?
    Denk aan een cirkeldiagram waarvan de segmenten alleen via de legendakleur te herleiden
    zijn, of twee tinten die nauwelijks van elkaar verschillen. Wie kleurenblind is loopt daar
    visueel tegenaan, los van wat een schermlezer met het document kan. Er is een QuickFinding
    "PDF - grafieken en diagrammen enkel afhankelijk van kleur" (impact klein, ontwerper).
    LET OP: de kaarten-uitzondering geldt hier NIET. Kaarten zijn uitgezonderd bij 1.1.1 en
    1.4.5, niet bij 1.4.1. Een hittekaart waarvan de temperatuurzones alleen aan hun kleur te
    herkennen zijn, is dus WEL een 1.4.1-afkeuring: rood en oranje zijn voor iemand met
    protanopie nagenoeg gelijk. Je keurt niet af dat de kaart niet in tekst is uitgeschreven
    (dat valt onder de uitzondering), maar dat de legenda en de zones alleen op kleur werken.

Het onderscheid met 1.4.5: dat criterium heeft tags nodig omdat de vraag is wat er als
afbeelding is AANGEMERKT, een eigenschap van de code. Bij 1.4.1 is de vraag of kleur de enige
drager is, en dat zie je met het oog.

ALTIJD, ook bij een niet-getagd document:
  - 2.4.2 paginatitel → ontbreekt de documenttitel, of staat DisplayDocTitle niet aan
    waardoor de viewer de bestandsnaam toont, dan is dat een AFKEURING.
  - 3.1.1 taal → ontbreekt /Lang, dan een AFKEURING. Staat het er, dan 'voldoet'.

NIET ZELF BEOORDELEN:
  - 1.4.3 contrast → ALTIJD 'niet_te_bepalen' bij een PDF. De onderzoeker controleert het
    contrast in PDF-documenten handmatig. Meet het niet uit en schrijf er geen voorstel voor.
    Zet in 'reden': "Contrast in PDF-documenten wordt handmatig door de onderzoeker
    gecontroleerd."

NIET VAN TOEPASSING op een PDF: 1.4.10 reflow, 2.1.2 toetsenbordval, 2.5.3 label in naam,
2.5.8 grootte aanwijsgebied. Zet die op 'niet_aanwezig'.

IS HET DOCUMENT WEL GETAGD, dan gaat het om de KWALITEIT van de tags: leesvolgorde,
koppenniveaus, tekstalternatieven, lijststructuur, tabelkoppen. Die kwaliteit kun je zonder
PAC-output (PDF Accessibility Checker) niet betrouwbaar beoordelen. Zet de criteria die
daarvan afhangen op 'niet_te_bepalen' met als reden dat de onderzoeker PAC-output moet
aanleveren, en meld dat expliciet.

DAT GELDT OOK VOOR EEN GOEDKEURING. De verleiding is groot om te concluderen dat iets wél goed
staat — "de tabel heeft TH-cellen met Scope", "de afbeelding heeft een Alt". Zulke markeringen
staan meestal in een gecomprimeerde objectstroom die je niet kunt uitlezen. Vind je ze niet, dan
is dat geen bewijs dat ze ontbreken, maar het is evenmin bewijs dat ze er zijn. Zet het criterium
dan op 'niet_te_bepalen', niet op 'voldoet'. Een onterechte goedkeuring komt nergens in het
rapport terecht en blijft daardoor onzichtbaar.

EEN LOGO MOET ALTIJD GETAGD ZIJN. Het logo is geen versiering: het zegt van wie het document is,
en die informatie hoort een schermlezer voor te lezen. Het hoort als /Figure met een /Alt in de
tagboom te staan, niet als /Artifact (dat betekent "overslaan"). Concludeer dus NOOIT dat een
ongetagd of als Artifact gemarkeerd logo "correct wordt overgeslagen omdat het decoratief is".
Dat is een AFKEURING.

Voorbeeld van de fout die je moet vermijden: bij BEV-04 concludeerde de audit dat het logo in
een getagde besluitenlijst als Artifact was gemarkeerd en dus correct werd overgeslagen, en zette
1.1.1 op 'voldoet'. Twee fouten in één: er stonden nul /Artifact- en nul /Figure-voorkomens in de
bytes (een aanname over wat er stond), en een als Artifact gemarkeerd logo zou sowieso fout zijn
geweest (een verkeerde regel over wat er hoort te staan).

TE BEOORDELEN SUCCESCRITERIA (${requiredCodes.length} stuks — geef exact één assessment per code terug):
${scList}${bronnenSectie}

STATUS per criterium:
  voldoet          — het criterium is van toepassing EN er is geen probleem; zet in 'reden' WAT je hebt onderzocht
  afgekeurd        — echte WCAG-fout; vul voorstelBevinding (description + advice)
  opmerking        — best-practice/randgeval, geen echte fout; voorstelBevinding zonder impact/responsibility
  niet_aanwezig    — datgene waar het criterium over gaat, staat niet in dit document
  niet_te_bepalen  — kan niet worden vastgesteld; zie hieronder wat er in 'reden' hoort

'voldoet' of 'niet_aanwezig'? Kijk naar WAAR HET CRITERIUM OVER GAAT, niet naar wat er verder in
het document staat. Schrijf je in 'reden' iets als "het document bevat geen ...", dan hoort de
status 'niet_aanwezig' te zijn; met 'voldoet' spreken status en onderbouwing elkaar tegen.

'niet_te_bepalen' kent twee soorten, en het verschil zit in 'reden':

  (a) De onderzoeker kan het nog uitzoeken. Zet dan de CONCRETE VRAAG in 'reden', met alles
      wat jij al hebt vastgesteld erbij, zodat er zo min mogelijk werk overblijft.
      Voorbeeld: "In de video staat op 00:09 'Suzanne Klaassen, Wethouder Beverwijk' in beeld.
      Wordt die naam ook uitgesproken?"

  (b) De uitkomst staat al vast en er valt niets meer uit te zoeken. Zet dan de VASTSTELLING
      in 'reden', ZONDER vraagzin. Dit geldt vooral bij een ongetagde PDF: 1.1.1, 1.3.2, 1.4.5
      en 2.4.4 zijn daar niet te beoordelen omdat de structuur ontbreekt, en dat verandert pas
      als het document getagd wordt. Schrijf dus niet "is er een getagde versie beschikbaar?"
      — die is er niet, en dat IS de bevinding, geen vraag.

Verzin geen vraag om een 'niet_te_bepalen' te rechtvaardigen. Een vraag die de onderzoeker niet
kan beantwoorden, of waarvan het antwoord al vaststaat, kost alleen aandacht die naar de echte
vragen had moeten gaan.

'reden' bij 'voldoet' is niet optioneel. Een afkeuring komt in het rapport en wordt gelezen,
dus daar valt een fout op. Een goedkeuring levert geen tekst op: het criterium staat groen en
er is niets om over te struikelen. 'voldoet' is dus de status waar een fout onzichtbaar blijft.
Noteer daarom kort waarop je het baseert, zodat de onderzoeker het bij het nalopen van de
dekkingslijst kan wegen zonder de pagina zelf te openen. Bijvoorbeeld: "Alle 14 afbeeldingen
nagelopen, elk met een passend tekstalternatief" of "31 frames gescand op 3-seconde-interval,
geen tekst of handelingen in beeld". Schrijf niet "geen probleem gevonden" of "lijkt in orde":
dat herhaalt de status en zegt niets over wat je hebt gedaan.

SCHRIJFREGELS voor voorstelBevinding.description:
  - Begin NIET met de URL. Start met "In het document..." of "Op pagina 2...".
  - Kort en concreet: locatie, kernprobleem, effect voor de gebruiker. Meestal 3 zinnen.
  - Geen em-dash (—) of en-dash (–).
  - GEEN interne tagnamen: niet Figure, ImageData, Alt-attribuut, LBody, Lbl. Schrijf
    "als afbeelding aangemerkt", "tekstalternatief", "lijststructuur".
  - Geen toolnamen in het advies (niet Canva, Word, InDesign). Spreek over "het brondocument".
    Adobe Acrobat mag wel bij concrete tag-stappen.
  - Formuleer vanuit voorlezen/horen: hulpsoftware leest voor, laat niets zien.
Bij afgekeurd: kies impact uit klein|matig|serieus|kritiek en responsibility uit redacteur|ontwikkelaar|ontwerper.
Bij opmerking: laat impact en responsibility leeg.

Geef het resultaat terug in het schema. sampleId = ${sample.id}. Precies ${requiredCodes.length} assessments, één per code.`

// ---------------------------------------------------------------------------
// FASE 2/3/4 — pipeline per sample: audit → verifieer → QuickFinding-match.
// pipeline() zonder barrier: sample B kan al auditen terwijl sample A verifieert.
// ---------------------------------------------------------------------------
const results = await pipeline(
  teAuditen,

  // Stage 1 — AUDIT: één agent per sample, gaat ALLE SC's af.
  // PDF-samples krijgen een eigen prompt: daar beoordeel je de documentstructuur
  // (tags, titel, taal) in plaats van DOM en screenshot.
  (sample) =>
    isPdfSample(sample)
      ? agent(pdfPrompt(sample), {
          label: `audit-pdf:${sample.title}`,
          phase: 'Auditen',
          schema: AUDIT_SCHEMA,
        })
      : agent(
      `Je bent WCAG-auditor. Beoordeel ÉÉN sample-pagina tegen ELK van de onderstaande succescriteria. Sla NIETS over: geef voor elk criterium een status.

SAMPLE
  id:    ${sample.id}
  titel: ${sample.title}
  url:   ${sample.url || '(geen URL — mogelijk PDF/handmatig)'}
  type:  ${sample.sampleType}${sample.description ? `

WAT ER OVER DEZE PAGINA IS VASTGELEGD — lees dit voordat je begint:
  ${sample.description}` : ''}

WAT JE VAN DEZE PAGINA BEOORDEELT — ${homepageSample && sample.id === homepageSample.id ? 'HEADER, MAIN-CONTENT EN FOOTER' : 'ALLEEN DE MAIN-CONTENT'}
${
  homepageSample && sample.id === homepageSample.id
    ? `Dit is het homepage-sample. Beoordeel de hele pagina: header, main-content en footer. Sitebrede onderdelen (logo, hoofdnavigatie, toegankelijkheidsbalk, footer met adres, contactopties, sociale-media-links en partnerlijst) worden ALLEEN hier beoordeeld en gelden daarmee voor de hele website.`
    : `Dit is GEEN homepage-sample. Beoordeel UITSLUITEND de main-content van deze pagina.

Sla header, sitebrede navigatie, toegankelijkheidsbalk en footer volledig over: geen tekstalternatieven, geen koppen, geen links, geen structuur. Ook niet als je daar iets ziet dat fout is. Die onderdelen zijn identiek op elke pagina en zijn al op het homepage-sample${homepageSample ? ` ("${homepageSample.title}")` : ''} beoordeeld. Rapporteer je ze hier opnieuw, dan komt dezelfde bevinding meerdere keren in het rapport.

Afbakening: neem het <main>-element, of als dat ontbreekt het gebied tussen de sitebrede navigatie en de footer. Twijfel je of een blok bij de main-content hoort? Komt het ook op de homepage voor, dan is het template en sla je het over.

Zit een criterium volledig in header of footer en heeft de main-content er niets van, zet het dan op 'niet_aanwezig' met als reden dat het buiten de main-content valt.`
}

HTML/screenshot ophalen (dev server draait):
  npm run cli -- get-html ${sample.url ? sample.url : '<url>'} --text     (leesbare tekst)
  npm run cli -- get-html ${sample.url ? sample.url : '<url>'}            (ruwe HTML)
  npm run cli -- get-screenshot ${sample.url ? sample.url : '<url>'} --full-page
  npm run cli -- get-leesvolgorde ${sample.url ? sample.url : '<url>'} --zonder-css
Heeft de sample geen URL, beoordeel dan op basis van titel/type en zet twijfelgevallen op 'niet_te_bepalen'.

VERPLICHTE METINGEN. Deze criteria zijn te meten en mogen NOOIT op 'niet_te_bepalen' met een
vraag aan de onderzoeker. Draai de commando's; de uitkomst is je onderbouwing. Ze schrijven
zichzelf in het logboek, dus wat je niet hebt gedraaid staat er ook niet in.

  1.4.10 — npm run cli -- get-reflow ${sample.url ? sample.url : '<url>'} --breedte=320
  1.4.11 — npm run cli -- get-nietteksten ${sample.url ? sample.url : '<url>'}
  2.1.2  — npm run cli -- get-toetsenbordval ${sample.url ? sample.url : '<url>'}
           npm run cli -- get-toetsenbordval ${sample.url ? sample.url : '<url>'} --achteruit=true

Bij 2.1.2 gaat het om de hele pagina, van buiten het document naar buiten het document: in de
adresbalk beginnen, doortabben tot het laatste element onderaan, en dan hoort de volgende Tab
het document weer te verlaten. Beide richtingen, want een val kan één kant op zitten. Staat er
een widget op de pagina die pas na typen bestaat — een zoekveld met suggesties — draai dan ook
\`--typ-in=<css> --typ=<woord>\`, want anders test je een pagina waarop die lijst er niet is.

Bij 1.4.11 loopt \`get-nietteksten\` zelf op wat eronder valt en meet elk element in ruststand
én met de muis erop. Lees de lijst \`overgeslagen_met_reden\` na: staat daar iets tussen dat wel
betekenis draagt, meet dat dan alsnog met \`get-pixelcontrast --selector=<css>\`.

Heeft de site een hoogcontrastknop die zelf voldoet, dan is DIE weergave de weergave die telt
voor 1.4.3 en 1.4.11 — meet met \`--klik\`. Zie Shift2_Regels_SC_1_4_3.md, stap 2.

DRAAI \`get-leesvolgorde --zonder-css\` ALS EERSTE, en bekijk de kale schermafdruk voordat
je aan de criteria begint. Zonder opmaak valt in één blik te zien wat je in de HTML moet
uitzoeken:

  - een rij links die aan elkaar plakt is geen opsomming (1.3.1)
  - scheidingstekens die als gewone tekst tussen links staan (1.3.1)
  - de koppenhiërarchie, als kale h1/h2/h3 onder elkaar (1.3.1)
  - een tabel die alleen visueel een tabel was (1.3.1)
  - tekst die in een afbeelding blijkt te zitten, want die is dan niet leesbaar (1.1.1, 1.4.5)
  - verborgen labels en instructies die opeens zichtbaar worden (3.3.2)

Het commando meldt daarnaast waar de kijkvolgorde afwijkt van de codevolgorde, en schrijft
de voorleesvolgorde weg als tekstbestand. Dat is je bewijs voor 1.3.2: dat criterium is
niet te beoordelen op opgehaalde HTML, want of de opmaak de volgorde omkeert staat in
externe stylesheets die je niet ophaalt. Een gemelde omkering is pas een bevinding als het
verplaatste element betekenis draagt — een afbeelding met een leeg tekstalternatief telt
niet mee.

BEKIJK DE SCREENSHOT ECHT — de HTML alleen is niet genoeg.
Een leeg tekstalternatief (alt="") betekent NIET dat een afbeelding decoratief is; dat kun je alleen zien door ernaar te kijken. Loop elke afbeelding met alt="" na op de screenshot en stel vast of er leesbare tekst in staat (merknaam, embleem, slogan, banner, poster, infographic). Staat die tekst er wel en staat hij niet elders als echte tekst op de pagina, dan is dat een 1.1.1-bevinding. Leid "decoratief" nooit af uit de bestandsnaam of uit het ontbreken van alt-tekst.
Gebruik de screenshot ook om te toetsen of wat je in de HTML ziet daadwerkelijk zichtbaar is, en of visuele volgorde en codevolgorde overeenkomen.

TE BEOORDELEN SUCCESCRITERIA (${requiredCodes.length} stuks — geef exact één assessment per code terug):
${scList}${bronnenSectie}${afwijzingenSectie}${interactieveSectie}
CONTROLEER EERST HET VELD \`omgeleid\`. Staat dat op true, dan heeft de server je naar een
andere pagina gestuurd dan je vroeg en beoordeel je dus niet het sample dat je denkt te
beoordelen. Zet in dat geval ALLE criteria op 'niet_te_bepalen' met als reden dat de pagina
niet bereikbaar was, met het gevraagde en het werkelijke adres erbij. Schrijf geen enkel
oordeel op grond van wat je dan ziet.

Dit is geen zeldzaam geval maar een valstrik. Een formulier met stappen geeft elke stap een
eigen adres, maar laat je er alleen komen als de vorige stap is ingevuld; kom je binnen
zonder sessie, dan sta je weer bij stap 1. Die pagina ziet er niet uit als een fout — het
is een keurige, werkende pagina met de goede titel. Op heuvelrug.nl leiden zowel stap 2 als
stap 3 van het contactformulier terug naar stap 1.

\`get-html\` geeft een veld \`gehydrateerd\` terug. Normaal staat dat op true: de CLI haalt
de pagina met een echte browser op, dus de JavaScript van de site draait.

Staat het op false, dan is er iets mis met de pagina zelf — een scriptfout, een geblokkeerd
bestand. De HTML is er dan wel, maar er hangt geen enkele klikafhandelaar aan. Een knop
doet niets, een menu klapt niet uit, zoeksuggesties verschijnen niet, en dat ziet er
precies zo uit als een echte bevinding. Zet in dat geval alles wat interactie vereist op
'niet_te_bepalen' en meld in je antwoord dat de pagina niet gehydrateerd was. Verzin geen
afkeuring op iets dat je niet hebt kunnen bedienen.

STATUS per criterium:
  voldoet          — geen probleem gevonden
  afgekeurd        — echte WCAG-fout; vul voorstellen[]
  opmerking        — je hebt VASTGESTELD wat er aan de hand is, en het is geen echte WCAG-fout maar wel het benoemen waard; vul voorstellen[] zonder impact/responsibility
  niet_aanwezig    — het criterium is niet van toepassing op deze pagina
  niet_te_bepalen  — kan niet uit HTML/screenshot worden bepaald (bv. toetsenbord, reflow, contrast-check die interactie vereist)

MEERDERE PUNTEN OP ÉÉN CRITERIUM MAG. \`voorstellen\` is een lijst. Vind je op deze
pagina twee losse zaken onder hetzelfde criterium, zet ze er dan allebei in, elk met
een eigen \`type\` ('bevinding' of 'opmerking'). Propt ze NIET samen in één tekst en
schrijf het tweede punt niet weg in 'reden' — daar pakt niemand het op.
Voorbeeld: bij 2.4.4 kunnen de sociale-media-links de organisatienaam missen (bevinding)
terwijl daarnaast het eerste icoon het X-logo toont met "twitter" als naam (opmerking).
De Shift2-regels schrijven zo'n splitsing soms zelfs expliciet voor.
De \`status\` van het criterium is de zwaarste van je voorstellen: staat er één
'bevinding' tussen, dan is de status 'afgekeurd'; zijn het alleen opmerkingen, dan
'opmerking'.

TWIJFEL IS GEEN OPMERKING. Een opmerking is een oordeel dat je hebt kunnen vellen;
'niet_te_bepalen' is de status voor wat je niet kúnt vaststellen. Gebruik 'opmerking'
dus nooit als vergaarbak voor onzekerheid.
Drie tekenen dat je 'niet_te_bepalen' bedoelt en geen opmerking:
  - je schrijft "mogelijk", "waarschijnlijk", "lijkt erop" of "vermoedelijk" in de beschrijving
  - je eindigt de reden met een vraag aan de onderzoeker
  - je oordeel hangt af van iets dat je niet hebt gezien: een schermlezer, toetsenbord,
    zoom, of een interactie die je niet kunt uitvoeren
In die gevallen: zet 'niet_te_bepalen', LAAT voorstellen leeg, en schrijf in 'reden'
de concrete vraag die de onderzoeker in de browser moet beantwoorden. Een voorstel én een
vraag tegelijk aanleveren is tegenstrijdig: de onderzoeker kan dan niet beoordelen zonder
eerst zelf te kijken, en dan had het geen voorstel moeten zijn.
  voldoet          — het criterium is van toepassing EN er is geen probleem gevonden
  afgekeurd        — echte WCAG-fout; vul voorstelBevinding (description + advice)
  opmerking        — best-practice/randgeval, geen echte fout; voorstelBevinding zonder impact/responsibility
  niet_aanwezig    — datgene waar het criterium over gaat, staat niet op deze pagina
  niet_te_bepalen  — kan niet uit HTML/screenshot worden bepaald (bv. toetsenbord, reflow, contrast-check die interactie vereist)

'voldoet' of 'niet_aanwezig'? Lees \`wcag-regels/Shift2_Voldoet_Of_Niet_Aanwezig.md\`. Kern:
kijk naar wat het criterium EIST, niet naar wat er op de pagina staat.

  - Stelt het criterium een eis waaraan je ook zonder bijzonderheden voldoet? -> 'voldoet'
    2.3.1 (niets flitst vaker dan 3x per seconde), 1.4.1 (geen informatie via kleur alleen),
    1.3.3 (geen instructies die op vorm of locatie leunen), 3.1.2 (geen ongemarkeerde
    anderstalige passages). Een statische Nederlandse pagina VOLDOET daaraan.

  - Vereist het criterium dat er eerst iets aanwezig is? -> 'niet_aanwezig' als dat er niet is
    2.2.2 en 1.4.2 (content of geluid dat AUTOMATISCH start), 1.2.x (media), 3.3.1 en 3.3.2
    (formulier). Zonder dat is de eis leeg en valt er niets te toetsen.

Het scherpste onderscheid: 2.3.1 zegt "er mag niets flitsen" — daar houdt een statische pagina
zich aan, dus 'voldoet'. 2.2.2 zegt "als er iets automatisch beweegt, moet je het kunnen
pauzeren" — zonder automatische beweging is die eis leeg, dus 'niet_aanwezig'.

Let op: media op de pagina maakt niet élk media-criterium van toepassing. Bij een video die de
gebruiker zelf start zijn 2.2.2 en 1.4.2 nog steeds 'niet_aanwezig' (niets start automatisch),
terwijl 1.2.2, 1.2.3, 1.2.5 en 2.3.1 wél beoordeeld moeten worden.

Ga niet af op de zinsbouw van je eigen reden: "er is geen flitsende content" onderbouwt juist
'voldoet' bij 2.3.1, terwijl "er is geen automatisch startende video" bij 2.2.2 'niet_aanwezig'
onderbouwt.

UITZONDERING — niet-getagde PDF (alleen als de sample een PDF is die geen tags heeft):
  Een niet-getagde PDF heeft één wortel-oorzaak: de tag-structuur ontbreekt. Keur die af onder 1.3.1.
  Criteria die je alléén kunt beoordelen wanneer er tags zijn, keur je NIET apart af als gevolg van diezelfde
  oorzaak. Je stelt geen fout vast op iets dat zonder tags niet bestaat om te checken. Concreet:
    - 1.3.2 (leesvolgorde): 'niet_te_bepalen' — zonder tags is er geen programmatische leesvolgorde
    - 1.4.5 (afbeeldingen van tekst): 'niet_te_bepalen' — zonder tags is niet vast te stellen wat als
      afbeelding en wat als tekst is aangemerkt
    - 4.1.2 (naam, rol, waarde): 'niet_te_bepalen' — zonder tags is er geen structuur waarin naam en
      rol kunnen zitten. Alleen bij een ECHT invulbaar formulier (invulvelden, keuzerondjes,
      selectievakjes) is het zonder tags te beoordelen; de toegankelijke naam zit dan in de
      tooltip /TU. GA AF OP DE FUNCTIE, NIET OP DE TECHNIEK: een knop die als link werkt blijft
      een link en valt hier gewoon onder, ook als de bouwer hem als AcroForm-pushbutton
      (/FT /Btn met /Ff 65536) heeft opgeslagen in plaats van als Link-annotatie.
    - 1.1.1 (tekstalternatieven): opmerking, niet afgekeurd — zonder tags kun je niet vaststellen wat ontbreekt
  (Dit geldt specifiek voor niet-getagde PDF's, niet als algemene regel voor webpagina's.)

SCHRIJFREGELS voor elke voorstellen[].description (belangrijk):
  - Begin NIET met de URL. Start met "Op de pagina..." / "In de footer...".
  - Kort en concreet: locatie, kernprobleem, effect voor de gebruiker. Meestal 3 zinnen.
  - Geen em-dash (—) of en-dash (–). Splits in losse zinnen of gebruik een komma.
  - Geen HTML-codeblokken; noem elementen inline in de lopende tekst.
  - Formuleer vanuit voorlezen/horen (screenreaders lezen voor, ze "laten niet zien").
  - Maximaal 2-3 voorbeelden met "zoals".
Bij afgekeurd: kies impact uit klein|matig|serieus|kritiek en responsibility uit redacteur|ontwikkelaar|ontwerper.
Bij opmerking: laat impact en responsibility leeg.

Geef het resultaat terug in het schema. sampleId = ${sample.id}. Precies ${requiredCodes.length} assessments, één per code.`,
      { label: `audit:${sample.title}`, phase: 'Auditen', schema: AUDIT_SCHEMA },
    ),

  // Stage 2 — VERIFIEER: aparte agent controleert alleen de afkeuringen/opmerkingen.
  (audit, sample) => {
    if (!audit) return null
    // Vangnet: een interactief criterium is per definitie niet uit HTML/screenshot
    // te bepalen. Zet de auditor het toch op 'voldoet' of 'afgekeurd', dan corrigeren
    // we dat hier deterministisch — de verifier ziet 'voldoet' namelijk nooit.
    // 'niet_aanwezig' blijft staan: geen video op de pagina is een geldige uitkomst.
    for (const a of audit.assessments) {
      if (!INTERACTIEVE_SC[a.code]) continue
      if (a.status === 'niet_te_bepalen' || a.status === 'niet_aanwezig') continue
      a.reden = `[automatisch op niet_te_bepalen gezet: ${a.code} vereist een browsertest] ${a.reden || ''}`.trim()
      a.status = 'niet_te_bepalen'
      a.voorstellen = []
    }

    // Vangnet 2: de status hoort de zwaarste van de voorstellen te zijn. Zet de
    // auditor 'opmerking' terwijl er een bevinding tussen staat, dan zou die
    // bevinding het criterium niet afkeuren.
    for (const a of audit.assessments) {
      const lijst = a.voorstellen || []
      if (!lijst.length) continue
      const zwaarste = lijst.some((v) => v.type === 'bevinding') ? 'afgekeurd' : 'opmerking'
      if (a.status === 'afgekeurd' || a.status === 'opmerking') a.status = zwaarste
    }
    // ALLE oordelen gaan langs de verifieerder, niet alleen de afkeuringen.
    //
    // Dit stond eerder omgekeerd: was er niets af te keuren, dan draaide de verifieerder
    // helemaal niet. Daarmee werd precies overgeslagen waar een fout zich verstopt. Op
    // het homepage-sample van heuvelrug.nl stonden negentien onbevestigde oordelen, en
    // achttien daarvan zonder afkeuring: tien 'voldoet', vijf 'niet aanwezig', drie
    // 'niet te bepalen'. Bij een afkeuring kan de onderzoeker tegenspreken, want die
    // wijst naar iets. Bij een onterecht 'voldoet' wijst er niets.
    //
    // De verifieerder heeft daarmee twee taken die niet hetzelfde zijn. Een afkeuring
    // probeert hij te WEERLEGGEN — is dit werkelijk een fout. Bij elk oordeel, ook een
    // schoon, toetst hij de ONDERBOUWING: staat er wat er gedaan is, en klopt dat met
    // het spoor van metingen. Dat tweede was de hele dag het probleem, niet het oordeel.
    const teControleren = audit.assessments
    const afTeKeuren = audit.assessments.filter(
      (a) => a.status === 'afgekeurd' || a.status === 'opmerking',
    )
    return agent(
      `Je bent een kritische WCAG-verifier. Een andere auditor beoordeelde sample "${sample.title}" (${sample.url || 'geen URL'}).${sample.description ? `

WAT ER OVER DEZE PAGINA IS VASTGELEGD: ${sample.description}` : ''} Je hebt TWEE taken, en ze zijn niet hetzelfde.

EEN — DE AFKEURINGEN EN OPMERKINGEN WEERLEGGEN. Klopt het oordeel, en is de beschrijving correct en niet overdreven? Probeer elk oordeel te weerleggen; bevestig in \`bevestigd\` alleen wat standhoudt. Dat gaat om deze codes: ${afTeKeuren.map((a) => a.code).join(', ') || '(geen op dit sample)'}.

TWEE — BIJ ELK OORDEEL DE ONDERBOUWING TOETSEN, ook bij 'voldoet', 'niet aanwezig' en 'niet te bepalen'. Niet of het oordeel juist is, maar of de onderbouwing WAAR is: staat er wát er gedaan is, en klopt dat met de metingen die werkelijk zijn gedraaid? Dat is een andere vraag dan taak een, en juist daar zit het probleem. Bij een afkeuring kan de onderzoeker tegenspreken, want die wijst naar iets. Bij een onterecht 'voldoet' wijst er niets, en dan valt het niemand op.

Zet die tweede uitkomst in \`bewijsvoering\`. Laat \`bevestigd\` op true staan als het oordeel klopt, ook als er bij de bewijsvoering een 'nee' staat: een terecht oordeel met een rammelende onderbouwing is geen onterecht oordeel, en die twee door elkaar halen maakt beide waardeloos.
${
  isPdfSample(sample)
    ? `\nDit is een PDF-DOCUMENT, geen webpagina. De main-content-regel geldt hier niet; het hele document hoort beoordeeld te worden.\n`
    : homepageSample && sample.id === homepageSample.id
    ? `\nDit is het homepage-sample: header, main-content en footer horen hier allemaal beoordeeld te worden.\n`
    : `\nDit is GEEN homepage-sample. Alleen de main-content mag beoordeeld worden. WEERLEG elke bevinding die over de header, de sitebrede navigatie, de toegankelijkheidsbalk of de footer gaat, ook als de bevinding inhoudelijk klopt: die onderdelen worden alleen op het homepage-sample${homepageSample ? ` ("${homepageSample.title}")` : ''} gerapporteerd. Zet gecorrigeerdeStatus dan op 'niet_aanwezig' met als toelichting dat het buiten de main-content van deze pagina valt. Zie wcag-regels/Shift2_Scope_Per_Sample.md.\n`
}

TOETS TEGEN DE BRON, niet tegen je eigen WCAG-geheugen. Lees met je Read-tool voor ELKE code die je hieronder controleert (werkdirectory is de repo-root), met <code> als bijvoorbeeld 1_3_1:
  1. \`wcag-regels/Shift2_Regels_SC_<code>.md\` — de Shift2-beoordelingsregels. BINDEND: deze gaan vóór de checklist en vóór je eigen WCAG-interpretatie.
  2. \`wcag-checklists/Checklist_SC_<code>.md\` — de toetsingsinstructie
  3. \`wcag-checklists/Richtlijnen_Grensgevallen_SC_<code>.md\` — bestaat voor 1.1.1, 1.3.1, 2.4.4 en 2.4.6

LOOP DE PUNTEN VAN DE BEWIJSVOERING AF EN GEEF ZE TERUG IN \`bewijsvoering\`. Lees de kopjes van \`wcag-regels/Shift2_Bewijsvoering.md\` — dat zijn de punten. Neem de kop letterlijk over als \`punt\` en geef per punt 'ja', 'nee' of 'nvt', met een toelichting zodra het 'nee' of 'nvt' is. Lees die koppen uit het bestand; typ ze niet uit je hoofd, want dan mis je een punt dat er later bij komt.

Een 'nee' betekent NIET dat het oordeel fout is. Het betekent dat de onderbouwing het niet draagt. Zet \`bevestigd\` dus niet op false om die reden: dat veld gaat over het oordeel zelf. Een oordeel kan terecht zijn terwijl de onderbouwing rammelt, en juist dat moet zichtbaar worden.

Lees \`wcag-regels/Shift2_Bewijsvoering.md\` en toets of de onderbouwing draagt wat het oordeel beweert. Rust een schone uitkomst op een uitgevoerde controle, of alleen op de afwezigheid van een melding? Staat er bij 'niet_aanwezig' waarnaar is gezocht? Wordt er een afwezigheid vastgesteld in materiaal waarin het niet kón staan — zoals CSS-positionering in opgehaalde HTML? Weerleg dat, ook als het oordeel zelf waarschijnlijk juist is: een onterecht 'voldoet' valt later niemand op.

Lees daarnaast \`wcag-regels/Shift2_Schrijfregels.md\` en toets elke description en advice daaraan: geen URL aan het begin, geen gedachtestreepjes, geen HTML-codeblokken, geen vindplaats-lijst, hulpsoftware LEEST VOOR (laat niets zien), "tekstalternatief" niet "tekstbeschrijving", maximaal twee a drie voorbeelden, en bij een opmerking impact en responsibility leeg.

Weerleg een oordeel expliciet als het in strijd is met een Shift2-regel. Typische gevallen: een afkeuring op een teaser-afbeelding met alt="", of een afkeuring waar de regels een opmerking voorschrijven (zet dan gecorrigeerdeStatus op 'opmerking').

${
  afwijzingenPerCode.size
    ? `WEERLEG WAT AL EENS IS AFGEWEZEN. De onderzoeker heeft op dit project eerder vondsten verworpen; die staan hieronder met de reden. Komt een oordeel daarop neer, zet gecorrigeerdeStatus dan op 'voldoet' en verwijs naar de eerdere afwijzing — tenzij de auditor aantoonbaar iets anders beschrijft.
${[...afwijzingenPerCode.entries()]
        .map(([code, lijst]) => `  ${code}: ${lijst.map((a) => a.reden).join(' | ')}`)
        .join('\n')}

`
    : ''
}WEERLEG OOK ELKE TWIJFEL DIE ALS OPMERKING IS VERPAKT. Een opmerking is een oordeel dat de auditor heeft kunnen vellen; onzekerheid hoort op 'niet_te_bepalen'. Zie je in de beschrijving of de reden woorden als "mogelijk", "waarschijnlijk", "lijkt erop" of "vermoedelijk", of eindigt de reden met een vraag aan de onderzoeker, of hangt het oordeel af van een schermlezer, toetsenbord of zoom die de auditor niet heeft gebruikt — zet gecorrigeerdeStatus dan op 'niet_te_bepalen' met als toelichting welke vraag er nog openstaat. Een voorstel en een vraag tegelijk is tegenstrijdig: de onderzoeker kan zo niet beoordelen zonder eerst zelf te kijken.

LET OP bij een niet-getagde PDF: weerleg een afkeuring van 1.3.2 (leesvolgorde). Zonder tags is er geen programmatische leesvolgorde om te toetsen, dus dat hoort 'niet_te_bepalen' te zijn, niet afgekeurd. De ontbrekende tag-structuur wordt al onder 1.3.1 afgekeurd; keur het gevolg niet apart af.
LET OP bij een telefoonnummer- of e-maillink onder 2.4.4: weerleg die alleen als de link BEDOELD IS OM TE BELLEN of te mailen, ook bij een defecte of ontbrekende tel:-koppeling. Wijst de href naar een volledig andere bestemming (een webpagina of een document), dan is de afkeuring juist TERECHT en laat je hem staan: de linktekst voorspelt het doel dan onjuist. Zie Shift2_Regels_SC_2_4_4.md.

LET OP bij een niet-getagde PDF: de ontbrekende tagstructuur wordt al onder 1.3.1 afgekeurd. Weerleg elke afkeuring die een GEVOLG is van diezelfde oorzaak en zet gecorrigeerdeStatus op 'niet_te_bepalen': 1.3.2 (geen programmatische leesvolgorde), 1.4.5 (zonder tags geen onderscheid tussen tekst en afbeelding) en 3.2.4 (geen programmatisch herkenbare onderdelen om te vergelijken). Weerleg ook een AFKEURING onder 1.1.1: die hoort bij een ongetagde PDF een opmerking te zijn.
Maar 2.4.4, 2.4.6 en 1.4.1 horen bij een ongetagd document WEL beoordeeld te worden: die gaan over wat je ziet en leest, en dat staat er ook zonder tags. Weerleg een afkeuring daar dus NIET met het argument "het document is niet getagd". Weerleg wel een 2.4.4-afkeuring die erover gaat dat de link niet klikbaar is; dat valt onder 1.3.1.

Het onderscheid: 1.4.5 heeft tags nodig omdat de vraag is wat er als afbeelding is AANGEMERKT, een eigenschap van de code. 1.4.1 heeft ze niet nodig omdat de vraag is of kleur de enige drager van informatie is; wie kleurenblind is loopt daar visueel tegenaan, los van wat een schermlezer met het document kan.
Weerleg bij een PDF verder elke 1.4.3-bevinding over contrast: dat controleert de onderzoeker handmatig, dus dat hoort 'niet_te_bepalen' te zijn.

Haal zo nodig zelf de pagina op:
  npm run cli -- get-html ${sample.url || '<url>'} --text
  npm run cli -- get-screenshot ${sample.url || '<url>'} --full-page
  npm run cli -- get-leesvolgorde ${sample.url || '<url>'} --zonder-css

WEERLEG EEN OORDEEL OVER 1.3.2 DAT ALLEEN OP DE OPGEHAALDE HTML RUST. Of de opmaak de
leesvolgorde omkeert staat in externe stylesheets die niet worden opgehaald; "er is geen
CSS-positionering die de volgorde omkeert" is op die basis niet vast te stellen. Draai
get-leesvolgorde en beoordeel op wat daar uit komt.

TE CONTROLEREN:
${JSON.stringify(teControleren, null, 2)}

Geef per code terug of het bevestigd is (bevestigd=true/false), een korte toelichting, en optioneel een gecorrigeerdeStatus als je het oneens bent. sampleId = ${sample.id}.`,
      { label: `verify:${sample.title}`, phase: 'Verifiëren', schema: VERIFY_SCHEMA },
    ).then((verify) => ({ sampleId: sample.id, audit, verify }))
  },

  // Stage 3 — QUICKFINDING-MATCH: bestaat er al een QuickFinding voor elke bevestigde afkeuring?
  (row, sample) => {
    if (!row || !row.audit) return null
    const bevestigdeCodes = new Set(
      (row.verify?.oordelen || []).filter((o) => o.bevestigd).map((o) => o.code),
    )
    // Afkeuringen/opmerkingen die de verificatie hebben overleefd (of niet apart gecontroleerd hoefden).
    const relevante = row.audit.assessments.filter(
      (a) =>
        (a.status === 'afgekeurd' || a.status === 'opmerking') &&
        (bevestigdeCodes.size === 0 || bevestigdeCodes.has(a.code) || !row.verify?.oordelen?.length),
    )
    if (!relevante.length) {
      return { ...row, sample, qfMatches: { matches: [] } }
    }
    const codes = [...new Set(relevante.map((a) => a.code))]
    return agent(
      `Bepaal per afgekeurd criterium of er AL een passende QuickFinding bestaat in de bibliotheek, zodat we geen duplicaat aanmaken.

AFKEURINGEN/OPMERKINGEN voor sample "${sample.title}":
${JSON.stringify(
  relevante.flatMap((a) =>
    (a.voorstellen || []).map((v) => ({ code: a.code, type: v.type, description: v.description })),
  ),
  null,
  2,
)}

DE QUICKFINDING-BIBLIOTHEEK staat in \`${context.quickFindingsPad}\` (${context.aantalQuickFindings} stuks, JSON-array met id, title, criterionCode, description). Lees hem zelf; hij staat bewust niet in deze prompt.

Filter op de criteria die hier spelen — ${codes.join(', ')} — bijvoorbeeld zo:
  node -e "const q=require('./${context.quickFindingsPad}');console.log(JSON.stringify(q.filter(x=>['${codes.join("','")}'].includes(x.criterionCode)),null,1))"
Levert dat niets op, kijk dan of het veld anders heet of leeg is voordat je 'geen match' concludeert.

Geef per code: bestaatAl (true/false), en als true de quickFindingId + title die het beste past, met een korte toelichting waarom het (niet) matcht. Match op inhoud, niet alleen op criteriumcode.`,
      { label: `qf-match:${sample.title}`, phase: 'QuickFinding-match', schema: QF_MATCH_SCHEMA },
    ).then((qfMatches) => ({ ...row, sample, qfMatches }))
  },
)

// ---------------------------------------------------------------------------
// Samenvatten — geen writes. Rapport voor handmatige goedkeuring.
// ---------------------------------------------------------------------------
const clean = results.filter(Boolean)

const rapport = clean.map((row) => {
  const sampleId = row.sample?.id || row.audit?.sampleId
  const bestaandeVoorSample = bestaandeIndex.get(sampleId) || new Map()
  const verifyByCode = new Map((row.verify?.oordelen || []).map((o) => [o.code, o]))
  const qfByCode = new Map((row.qfMatches?.matches || []).map((m) => [m.code, m]))
  const assessments = (row.audit?.assessments || []).map((a) => {
    const v = verifyByCode.get(a.code)
    const qf = qfByCode.get(a.code)
    // Verse audit, maar labelen t.o.v. bestaande bevindingen zodat jij weet
    // wat nieuw is. Match op sample + criteriumcode.
    const bestaandeCode = bestaandeVoorSample.get(a.code)
    return {
      code: a.code,
      status: v?.gecorrigeerdeStatus || a.status,
      reden: a.reden,
      // 'nieuw' of 'bestaat_al' (met findingCode) — alleen zinvol bij afkeuring/opmerking.
      nieuwOfBestaand: bestaandeCode ? 'bestaat_al' : 'nieuw',
      bestaandeBevindingCode: bestaandeCode || null,
      geverifieerd: v ? v.bevestigd : null,
      verificatie: v?.toelichting || null,
      // De afgelopen punten uit de bewijsvoering. Gaat mee naar de database, zodat de
      // onderzoeker op de kaart ziet wat er is nagekeken en wat niet standhield.
      controle: v?.bewijsvoering?.length
        ? { bevestigd: v.bevestigd, punten: v.bewijsvoering }
        : null,
      voorstellen: a.voorstellen || [],
      bestaandeQuickFinding: qf?.bestaatAl ? { id: qf.quickFindingId, title: qf.quickFindingTitle } : null,
      quickFindingToelichting: qf?.toelichting || null,
    }
  })
  return {
    sampleId: row.sample?.id || row.audit?.sampleId,
    sampleTitle: row.sample?.title,
    url: row.sample?.url,
    // Alleen de interessante regels vooraan; volledige lijst zit in assessments.
    afkeuringen: assessments.filter((a) => a.status === 'afgekeurd'),
    opmerkingen: assessments.filter((a) => a.status === 'opmerking'),
    nietTeBepalen: assessments.filter((a) => a.status === 'niet_te_bepalen').map((a) => a.code),
    assessments,
  }
})

// ---------------------------------------------------------------------------
// FASE 4 — WEGSCHRIJVEN. Tot nu toe eindigde deze workflow bij een rapport en
// verdwenen de oordelen zodra het venster dichtging: van de zeshonderd
// beoordelingen bleef alleen over wat fout was. Daardoor was niet te zien of een
// criterium in orde was of nooit bekeken.
//
// De oordelen gaan nu naar sample_criterion_checks, en de afkeuringen worden
// aangemaakt als voorstel — niet als bevinding. Ze tellen dus nergens mee tot de
// onderzoeker akkoord geeft. Zie docs/adr/0001-akkoord-als-poort.md.
//
// Draai met args.drooglopen = true om alleen te rapporteren, zonder te schrijven.
// ---------------------------------------------------------------------------
const drooglopen = opts.drooglopen === true

let schrijfResultaat = { overgeslagen: true, reden: 'drooglopen' }

if (!drooglopen) {
  phase('Wegschrijven')

  const schrijvers = await parallel(
    rapport.map((row) => () => {
      const sampleId = row.sampleId
      if (!sampleId || !row.assessments?.length) return Promise.resolve(null)

      // Alleen wat nieuw is wordt een voorstel; bestaat er al een bevinding op
      // deze combinatie, dan zou een tweede een duplicaat zijn.
      // Vlak uit: één criterium kan meerdere voorstellen opleveren, elk met een
      // eigen type. Ze worden hieronder ook als losse voorstellen aangemaakt.
      const nieuweVoorstellen = row.assessments
        .filter(
          (a) =>
            (a.status === 'afgekeurd' || a.status === 'opmerking') &&
            a.nieuwOfBestaand === 'nieuw' &&
            (a.voorstellen || []).length,
        )
        .flatMap((a) =>
          a.voorstellen.map((v) => ({
            code: a.code,
            type: v.type,
            description: v.description,
            advice: v.advice,
            impact: v.type === 'opmerking' ? null : v.impact,
            responsibility: v.type === 'opmerking' ? null : v.responsibility,
            bestaandeQuickFinding: a.bestaandeQuickFinding?.title || null,
          })),
        )

      const oordelen = row.assessments.map((a) => ({
        sampleItemId: sampleId,
        criterionCode: a.code,
        status: a.status,
        reden: a.reden || null,
        // De uitkomst van de verificatie hoort bij het oordeel te blijven. Tot nu toe
        // werd die weggegooid zodra de workflow klaar was: de onderzoeker zag in de
        // stapel nooit of iemand ernaar had gekeken.
        controle: a.controle || undefined,
      }))

      return agent(
        `Schrijf de uitkomsten van sample "${row.sampleTitle}" weg met de audit-CLI. De dev-server draait; werkdirectory is de repo-root.

STAP 1 — de oordelen per criterium.
Schrijf onderstaande JSON naar een tijdelijk bestand en pijp het naar de CLI:

  npm run cli -- save-checks ${projectId} --bron=workflow < <jouw-bestand>.json

Controleer het antwoord: "geschreven" hoort ${oordelen.length} te zijn en "overgeslagen" 0. Is dat niet zo, meld dan wat er misging; verzin geen tweede poging met andere codes.

DE OORDELEN:
${JSON.stringify(oordelen, null, 1)}

STAP 1B — koppel het logboek aan de oordelen.

  npm run cli -- koppel-logboek ${projectId}

Dit leest wat de CLI tijdens de audit heeft weggeschreven en zet per oordeel vast waarop het rust: welke metingen er zijn gedraaid, met welke argumenten en welke uitkomst. TYP DAT NIET ZELF OVER en verzin geen regels. Het commando leest het logboek en de onderzoeker kan het naast jouw antwoord leggen; een regel die jij toevoegt en die niet gedraaid is, valt daarmee door de mand.

Meld in je antwoord het getal bij "gekoppeld". Is dat 0 terwijl je wel metingen hebt gedraaid, dan is er iets mis met de koppeling van adres naar sample; meld dat.

STAP 2 — de afkeuringen als voorstel.
${
  nieuweVoorstellen.length === 0
    ? 'Er zijn geen nieuwe afkeuringen of opmerkingen op dit sample. Sla deze stap over.'
    : `Maak per punt hieronder een APART voorstel aan met:

  npm run cli -- create-finding ${projectId} --criterion=<criteriumId> --description="..." --advice="..." --status=voorstel --sample-items=${sampleId} [--impact=...] [--responsibility=...]

Let op:
  - Er staan ${nieuweVoorstellen.length} punten in de lijst; maak er dus ${nieuweVoorstellen.length} aan. Staan er twee onder hetzelfde criterium, dan zijn dat twee losse voorstellen — voeg ze NIET samen.
  - --status=voorstel is verplicht. Een voorstel telt nergens mee tot de onderzoeker akkoord geeft; maak dus GEEN bevinding met status open.
  - Bij type 'bevinding' geef je ZOWEL --impact als --responsibility mee; de auditor heeft die bepaald en ze staan hieronder. Zonder responsibility klaagt de schrijfregel-linter, en moet de onderzoeker het alsnog met de hand invullen.
  - Bij type 'opmerking' laat je --impact en --responsibility allebei weg; die heeft geen ernst en geen adressant.
  - Het criteriumId haal je uit \`npm run cli -- list-criteria\` (niet de code, de id).
  - Gebruik --skip-lint NIET. Klaagt de schrijfregel-linter, pas dan de tekst aan volgens wcag-regels/Shift2_Schrijfregels.md en probeer opnieuw.

DE PUNTEN:
${JSON.stringify(nieuweVoorstellen, null, 1)}`
}

Geef terug hoeveel oordelen zijn weggeschreven, hoeveel voorstellen zijn aangemaakt met welke codes, en wat er eventueel misging.`,
        {
          label: `schrijf:${row.sampleTitle}`,
          phase: 'Wegschrijven',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['sampleTitle', 'oordelenGeschreven', 'voorstellenAangemaakt'],
            properties: {
              sampleTitle: { type: 'string' },
              oordelenGeschreven: { type: 'number' },
              voorstellenAangemaakt: { type: 'array', items: { type: 'string' } },
              fouten: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      )
    }),
  )

  const gelukt = schrijvers.filter(Boolean)
  const totaalOordelen = gelukt.reduce((n, s) => n + (s.oordelenGeschreven || 0), 0)
  const totaalVoorstellen = gelukt.flatMap((s) => s.voorstellenAangemaakt || [])
  const schrijffouten = gelukt.flatMap((s) => s.fouten || [])

  log(
    `Weggeschreven: ${totaalOordelen} sampleoordelen, ${totaalVoorstellen.length} voorstellen (${totaalVoorstellen.join(', ') || 'geen'}). ${schrijffouten.length ? schrijffouten.length + ' fout(en).' : ''}`,
  )

  schrijfResultaat = {
    overgeslagen: false,
    oordelenGeschreven: totaalOordelen,
    voorstellen: totaalVoorstellen,
    fouten: schrijffouten,
  }
}

// Volledigheids-check: welke sample×SC-combinaties ontbreken? (zou 0 moeten zijn)
const gaten = []
for (const row of rapport) {
  const gedekt = new Set(row.assessments.map((a) => a.code))
  const mist = requiredCodes.filter((c) => !gedekt.has(c))
  if (mist.length) gaten.push({ sample: row.sampleTitle, ontbrekendeCriteria: mist })
}

// Tellingen voor het overzicht.
const alleAfk = rapport.flatMap((r) => r.afkeuringen)
const nieuweAfk = alleAfk.filter((a) => a.nieuwOfBestaand === 'nieuw')
const bestaandeAfk = alleAfk.filter((a) => a.nieuwOfBestaand === 'bestaat_al')

// Handmatige-check-todo: per pagina de criteria die een browsertest vereisen.
// Voor de criteria met een vastgelegde vraag in INTERACTIEVE_SC staat de letterlijke
// vraag erbij, zodat dit een afvinkbare lijst is. De auditor kan in 'reden' een
// eigen, pagina-specifieke vraag hebben gezet; die nemen we mee als context.
const handmatigeChecks = rapport
  .filter((r) => r.nietTeBepalen.length)
  .map((r) => ({
    sampleTitle: r.sampleTitle,
    url: r.url,
    teControlerenInBrowser: r.nietTeBepalen,
    vragen: r.nietTeBepalen.map((code) => {
      const a = r.assessments.find((x) => x.code === code)
      const standaard = INTERACTIEVE_SC[code]
      return {
        code,
        vraag: standaard
          ? standaard.replace(/\{pagina\}/g, r.sampleTitle || 'deze pagina')
          : `Handmatig controleren in de browser: ${code}.`,
        contextVanAuditor: a?.reden || null,
      }
    }),
  }))

// Dezelfde vragen gegroepeerd per criterium, zodat je één check (bv. reflow op
// 320px) in één keer voor alle pagina's kunt doen in plaats van pagina voor pagina.
const openVragenPerCriterium = [...new Set(handmatigeChecks.flatMap((h) => h.teControlerenInBrowser))]
  .sort()
  .map((code) => ({
    code,
    standaardvraag: INTERACTIEVE_SC[code]?.replace(/\{pagina\}/g, 'de pagina') || null,
    paginas: handmatigeChecks
      .filter((h) => h.teControlerenInBrowser.includes(code))
      .map((h) => ({ sampleTitle: h.sampleTitle, url: h.url })),
  }))

const aantalVragen = handmatigeChecks.reduce((n, h) => n + h.vragen.length, 0)
log(`Klaar. ${rapport.length} samples verwerkt (waarvan ${aantalPdfTeAuditen} PDF). ${nieuweAfk.length} nieuwe afkeuringen, ${bestaandeAfk.length} overlappen met bestaande bevindingen. ${aantalVragen} vragen voor handmatige controle (${openVragenPerCriterium.length} criteria). ${gaten.length ? gaten.length + ' sample(s) met ontbrekende criteria!' : 'Geen enkel criterium overgeslagen.'}`)

return {
  onderzoekstype: context.researchTypeName,
  wegschrijven: schrijfResultaat,
  aantalHtmlSamples: rapport.length,
  aantalSamples: rapport.length,
  aantalPdfSamples: aantalPdfTeAuditen,
  overgeslagenSamples: overgeslagen.map((s) => ({ title: s.title, sampleType: s.sampleType })),
  aantalCriteriaPerSample: requiredCodes.length,
  afkeuringenTotaal: alleAfk.length,
  afkeuringenNieuw: nieuweAfk.length,
  afkeuringenBestaatAl: bestaandeAfk.length,
  volledigheidsGaten: gaten,
  handmatigeChecks,
  openVragenPerCriterium,
  rapport,
}
