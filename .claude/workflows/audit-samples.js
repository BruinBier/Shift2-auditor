export const meta = {
  name: 'audit-samples',
  description: 'Per sample: audit alle succescriteria van het onderzoekstype met de Shift2-beoordelingsregels en de checklists, verifieer, en match tegen bestaande QuickFindings',
  whenToUse: 'Voor een WCAG-audit waarbij per sample elk succescriterium moet worden beoordeeld zonder dat er criteria worden overgeslagen. Werkt op HTML-pagina\'s en op PDF-documenten (die krijgen een eigen beoordeling op documentstructuur). Levert een voorstel-rapport plus een lijst met vragen die handmatig beantwoord moeten worden; schrijft niets naar de database.',
  phases: [
    { title: 'Voorbereiden', detail: 'Project, samples, SC-set en QuickFindings ophalen' },
    { title: 'Auditen', detail: 'Eén auditor-agent per sample gaat alle SC\'s af (Shift2-regels + wcag-checklists)' },
    { title: 'Verifiëren', detail: 'Verifier-agent controleert de afkeuringen per sample' },
    { title: 'QuickFinding-match', detail: 'Per afkeuring: bestaat er al een passende QuickFinding?' },
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
        required: ['id', 'title', 'url', 'sampleType'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: ['string', 'null'] },
          sampleType: { type: 'string' },
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
  },
}

const overrideCriteria = Array.isArray(opts.criteria) && opts.criteria.length
  ? `\n\nBELANGRIJK: gebruik UITSLUITEND deze SC-codes als criteria-set: ${opts.criteria.join(', ')}.`
  : ''

const context = await agent(
  `Je bent de scout voor een WCAG-audit-workflow. Verzamel read-only context via de audit-CLI (\`npm run cli -- <command>\`). De dev server draait al.

Project-id: ${projectId}

Doe het volgende, in deze volgorde, en geef ALLE gevonden data terug in het schema:

1. \`npm run cli -- get-project ${projectId}\` — noteer project.researchType (de naam van het onderzoekstype) en de volledige lijst sampleItems (id, title, url, sampleType). Neem ALLE sample-items op.

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

4. \`curl -s "http://localhost:3000/api/projects/${projectId}/findings"\` — de BESTAANDE bevindingen. Geef per bevinding terug: findingCode, criterion (de code, bv. "1.3.1"), sampleItemIds (de id's uit occurrences[].sampleItem.id of occurrences[].sampleItemId), en de eerste ~150 tekens van description. Deze worden NIET aan de auditors getoond; ze dienen alleen om later te labelen wat nieuw is.

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

// Index van bestaande bevindingen per sampleId → set van criteriumcodes,
// zodat we straks 'nieuw' vs 'bestaat_al' kunnen labelen (verse audit — de
// auditors zien dit niet).
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

// Criteria waarvoor een Shift2_Regels-bestand in wcag-regels/ bestaat. Puur om de
// auditor gericht te verwijzen; ontbreekt een code hier, dan is er (nog) geen
// regelbestand en beoordeelt de auditor op checklist + WCAG-tekst.
const SC_MET_REGELBESTAND = [
  '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.3.1', '1.3.2', '1.3.3', '1.3.5',
  '1.4.1', '1.4.3', '1.4.5', '1.4.10', '1.4.11', '2.1.2', '2.4.4', '2.4.6', '2.5.3', '2.5.8',
  '3.2.4', '4.1.2',
]

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
const GRENSGEVALLEN = ['1.1.1', '1.3.1', '2.4.4', '2.4.6']
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
          // Alleen invullen bij 'afgekeurd' of 'opmerking'.
          voorstelBevinding: {
            type: 'object',
            additionalProperties: false,
            required: ['description', 'advice'],
            properties: {
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
        required: ['code', 'bevestigd', 'toelichting'],
        properties: {
          code: { type: 'string' },
          bevestigd: { type: 'boolean' },
          toelichting: { type: 'string' },
          // Optionele correctie op status als de verifier het oneens is.
          gecorrigeerdeStatus: { type: 'string', enum: STATUS_ENUM },
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
  type:  ${sample.sampleType}

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
Heeft de sample geen URL, beoordeel dan op basis van titel/type en zet twijfelgevallen op 'niet_te_bepalen'.

BEKIJK DE SCREENSHOT ECHT — de HTML alleen is niet genoeg.
Een leeg tekstalternatief (alt="") betekent NIET dat een afbeelding decoratief is; dat kun je alleen zien door ernaar te kijken. Loop elke afbeelding met alt="" na op de screenshot en stel vast of er leesbare tekst in staat (merknaam, embleem, slogan, banner, poster, infographic). Staat die tekst er wel en staat hij niet elders als echte tekst op de pagina, dan is dat een 1.1.1-bevinding. Leid "decoratief" nooit af uit de bestandsnaam of uit het ontbreken van alt-tekst.
Gebruik de screenshot ook om te toetsen of wat je in de HTML ziet daadwerkelijk zichtbaar is, en of visuele volgorde en codevolgorde overeenkomen.

TE BEOORDELEN SUCCESCRITERIA (${requiredCodes.length} stuks — geef exact één assessment per code terug):
${scList}${bronnenSectie}${interactieveSectie}
STATUS per criterium:
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

SCHRIJFREGELS voor voorstelBevinding.description (belangrijk):
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
      a.voorstelBevinding = null
    }
    const teControleren = audit.assessments.filter(
      (a) => a.status === 'afgekeurd' || a.status === 'opmerking',
    )
    if (!teControleren.length) {
      return { sampleId: sample.id, audit, verify: { sampleId: sample.id, oordelen: [] } }
    }
    return agent(
      `Je bent een kritische WCAG-verifier. Een andere auditor beoordeelde sample "${sample.title}" (${sample.url || 'geen URL'}). Controleer UITSLUITEND de onderstaande afkeuringen en opmerkingen: klopt het oordeel, en is de beschrijving correct en niet overdreven? Probeer elk oordeel te weerleggen; bevestig alleen wat standhoudt.
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

Lees daarnaast \`wcag-regels/Shift2_Schrijfregels.md\` en toets elke description en advice daaraan: geen URL aan het begin, geen gedachtestreepjes, geen HTML-codeblokken, geen vindplaats-lijst, hulpsoftware LEEST VOOR (laat niets zien), "tekstalternatief" niet "tekstbeschrijving", maximaal twee a drie voorbeelden, en bij een opmerking impact en responsibility leeg.

Weerleg een oordeel expliciet als het in strijd is met een Shift2-regel. Typische gevallen: een afkeuring op een teaser-afbeelding met alt="", of een afkeuring waar de regels een opmerking voorschrijven (zet dan gecorrigeerdeStatus op 'opmerking').

LET OP bij een telefoonnummer- of e-maillink onder 2.4.4: weerleg die alleen als de link BEDOELD IS OM TE BELLEN of te mailen, ook bij een defecte of ontbrekende tel:-koppeling. Wijst de href naar een volledig andere bestemming (een webpagina of een document), dan is de afkeuring juist TERECHT en laat je hem staan: de linktekst voorspelt het doel dan onjuist. Zie Shift2_Regels_SC_2_4_4.md.

LET OP bij een niet-getagde PDF: de ontbrekende tagstructuur wordt al onder 1.3.1 afgekeurd. Weerleg elke afkeuring die een GEVOLG is van diezelfde oorzaak en zet gecorrigeerdeStatus op 'niet_te_bepalen': 1.3.2 (geen programmatische leesvolgorde), 1.4.5 (zonder tags geen onderscheid tussen tekst en afbeelding) en 3.2.4 (geen programmatisch herkenbare onderdelen om te vergelijken). Weerleg ook een AFKEURING onder 1.1.1: die hoort bij een ongetagde PDF een opmerking te zijn.
Maar 2.4.4, 2.4.6 en 1.4.1 horen bij een ongetagd document WEL beoordeeld te worden: die gaan over wat je ziet en leest, en dat staat er ook zonder tags. Weerleg een afkeuring daar dus NIET met het argument "het document is niet getagd". Weerleg wel een 2.4.4-afkeuring die erover gaat dat de link niet klikbaar is; dat valt onder 1.3.1.

Het onderscheid: 1.4.5 heeft tags nodig omdat de vraag is wat er als afbeelding is AANGEMERKT, een eigenschap van de code. 1.4.1 heeft ze niet nodig omdat de vraag is of kleur de enige drager van informatie is; wie kleurenblind is loopt daar visueel tegenaan, los van wat een schermlezer met het document kan.
Weerleg bij een PDF verder elke 1.4.3-bevinding over contrast: dat controleert de onderzoeker handmatig, dus dat hoort 'niet_te_bepalen' te zijn.

Haal zo nodig zelf de pagina op:
  npm run cli -- get-html ${sample.url || '<url>'} --text
  npm run cli -- get-screenshot ${sample.url || '<url>'} --full-page

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
${JSON.stringify(relevante.map((a) => ({ code: a.code, description: a.voorstelBevinding?.description })), null, 2)}

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
      voorstelBevinding: a.voorstelBevinding || null,
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
