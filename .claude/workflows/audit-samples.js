export const meta = {
  name: 'audit-samples',
  description: 'Per sample: audit alle succescriteria van het onderzoekstype met de Shift2-beoordelingsregels en de checklists, verifieer, en match tegen bestaande QuickFindings',
  whenToUse: 'Voor een WCAG-audit waarbij per sample-pagina elk succescriterium moet worden beoordeeld zonder dat er criteria worden overgeslagen. Levert een voorstel-rapport plus een lijst met vragen die handmatig in de browser beantwoord moeten worden; schrijft niets naar de database.',
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

// Alleen HTML-pagina's auditen: samples met een echte http(s)-URL. PDF/URL-loze
// samples slaan we over (die vereisen PAC-output die de workflow niet heeft).
// PDF-samples horen hier NIET bij: die vereisen PAC-output (PDF Accessibility Checker) die
// deze workflow niet heeft. Zonder die output kun je een PDF niet betrouwbaar beoordelen, dus
// filteren we op sampleType EN op de .pdf-extensie in de URL (een sample kan als 'structured'
// zijn aangemaakt terwijl de URL naar een PDF wijst).
const htmlSamples = context.samples.filter(
  (s) =>
    typeof s.url === 'string' &&
    /^https?:\/\//i.test(s.url) &&
    s.sampleType !== 'pdf' &&
    !/\.pdf(\?|#|$)/i.test(s.url),
)
const overgeslagen = context.samples.filter((s) => !htmlSamples.includes(s))

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

if (!htmlSamples.length) {
  return { error: 'Geen HTML-samples (met http(s)-URL) om te auditen.', overgeslagen }
}

// Sample-selectie:
//   opts.sampleIds      — alleen deze sample-id's auditen (heeft voorrang)
//   opts.skipSampleIds  — deze overslaan, bv. samples die al zijn afgerond
//   opts.maxSamples     — testlimiet: alleen de eerste N
// Let op: het homepage-sample wordt hieronder apart bepaald uit ALLE html-samples, ook als
// het zelf niet geauditeerd wordt. De auditor moet immers weten of hij op de homepage zit.
let teAuditen = htmlSamples
if (Array.isArray(opts.sampleIds) && opts.sampleIds.length) {
  const wil = new Set(opts.sampleIds)
  teAuditen = htmlSamples.filter((s) => wil.has(s.id))
  const nietGevonden = opts.sampleIds.filter((id) => !htmlSamples.some((s) => s.id === id))
  if (nietGevonden.length) log(`LET OP: ${nietGevonden.length} opgegeven sample-id(s) niet gevonden of geen HTML-sample: ${nietGevonden.join(', ')}`)
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
  return { error: 'Geen samples over om te auditen na filtering.', htmlSamples: htmlSamples.map((s) => ({ id: s.id, title: s.title })) }
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

log(`${teAuditen.length} van ${htmlSamples.length} HTML-samples × ${context.criteria.length} criteria (onderzoekstype: ${context.researchTypeName}). ${overgeslagen.length} niet-HTML samples overgeslagen. ${context.existingFindings?.length || 0} bestaande bevindingen als referentie. QuickFinding-bibliotheek: ${context.aantalQuickFindings || 0} stuks in ${context.quickFindingsPad || '(geen pad)'}.`)

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
const INTERACTIEVE_SC = {
  '1.2.3': 'Bevatten de videos op {pagina} visuele informatie die niet hoorbaar wordt genoemd (naam-in-beeld, locatie-labels, lower thirds)? En is er ruimte in het audiospoor voor audiodescriptie?',
  '1.2.5': 'Is er in de videos op {pagina} ruimte in het audiospoor voor audiodescriptie (natuurlijke pauzes), of wordt er continu gesproken? Graag per video, met tijdstip.',
  '1.4.3': 'Heeft de hoogcontrast-/toegankelijkheidsknop op {pagina} zelf voldoende contrast? En zo ja, voldoet de hoog-contrast-versie inhoudelijk? Blijven daarbij ook de logos en afbeeldingen met tekst leesbaar in die weergave (let op het footer-logo)?',
  '1.4.10': 'Kun je {pagina} checken op 320px breedte (DevTools responsive mode of het venster versmallen)? Werkt alles zonder horizontaal scrollen, en valt er geen content weg?',
  '1.4.11': 'Heeft de hoogcontrast-/toegankelijkheidsknop op {pagina} zelf voldoende contrast (geldt voor 1.4.11 net als voor 1.4.3)?',
  '2.1.2': 'Kun je met Tab door {pagina} navigeren en bevestigen dat je nergens vast komt te zitten (modals, custom dropdowns, embeds)?',
}

// Criteria waarvoor een Shift2_Regels-bestand in wcag-regels/ bestaat. Puur om de
// auditor gericht te verwijzen; ontbreekt een code hier, dan is er (nog) geen
// regelbestand en beoordeelt de auditor op checklist + WCAG-tekst.
const SC_MET_REGELBESTAND = [
  '1.1.1', '1.2.3', '1.2.5', '1.3.1', '1.3.2', '1.3.3', '1.3.5',
  '1.4.3', '1.4.5', '1.4.10', '1.4.11', '2.1.2', '2.4.4', '2.4.6', '4.1.2',
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
  - \`wcag-regels/Shift2_Schrijfregels.md\` — VERPLICHT. De schrijfregels voor elke bevinding: structuur, toon, terminologie, wat je niet doet. Bindend, ook waar ze afwijken van de projectinstructie.
  - \`wcag-checklists/Project_Instructie_WCAG_Audit.md\` — werkwijze en bevindingformat
  - \`wcag-checklists/Voorbeelden_Bevindingen.md\` — schrijfstijl en toon
  - \`wcag-regels/README.md\` — hoe de regels zich tot de checklists verhouden

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
// FASE 2/3/4 — pipeline per sample: audit → verifieer → QuickFinding-match.
// pipeline() zonder barrier: sample B kan al auditen terwijl sample A verifieert.
// ---------------------------------------------------------------------------
const results = await pipeline(
  teAuditen,

  // Stage 1 — AUDIT: één agent per sample, gaat ALLE SC's af.
  (sample) =>
    agent(
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
  voldoet          — geen probleem gevonden
  afgekeurd        — echte WCAG-fout; vul voorstelBevinding (description + advice)
  opmerking        — best-practice/randgeval, geen echte fout; voorstelBevinding zonder impact/responsibility
  niet_aanwezig    — het criterium is niet van toepassing op deze pagina
  niet_te_bepalen  — kan niet uit HTML/screenshot worden bepaald (bv. toetsenbord, reflow, contrast-check die interactie vereist)

UITZONDERING — niet-getagde PDF (alleen als de sample een PDF is die geen tags heeft):
  Een niet-getagde PDF heeft één wortel-oorzaak: de tag-structuur ontbreekt. Keur die af onder 1.3.1.
  Criteria die je alléén kunt beoordelen wanneer er tags zijn, keur je NIET apart af als gevolg van diezelfde
  oorzaak. Met name 1.3.2 (leesvolgorde): zonder tags is er geen programmatische leesvolgorde om te toetsen,
  dus zet 1.3.2 op 'niet_te_bepalen' met die reden. Je stelt geen fout vast op iets dat zonder tags niet
  bestaat om te checken. (Dit geldt specifiek voor niet-getagde PDF's, niet als algemene regel voor webpagina's.)

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
  homepageSample && sample.id === homepageSample.id
    ? `\nDit is het homepage-sample: header, main-content en footer horen hier allemaal beoordeeld te worden.\n`
    : `\nDit is GEEN homepage-sample. Alleen de main-content mag beoordeeld worden. WEERLEG elke bevinding die over de header, de sitebrede navigatie, de toegankelijkheidsbalk of de footer gaat, ook als de bevinding inhoudelijk klopt: die onderdelen worden alleen op het homepage-sample${homepageSample ? ` ("${homepageSample.title}")` : ''} gerapporteerd. Zet gecorrigeerdeStatus dan op 'niet_aanwezig' met als toelichting dat het buiten de main-content van deze pagina valt. Zie wcag-regels/Shift2_Scope_Per_Sample.md.\n`
}

TOETS TEGEN DE BRON, niet tegen je eigen WCAG-geheugen. Lees met je Read-tool voor ELKE code die je hieronder controleert (werkdirectory is de repo-root), met <code> als bijvoorbeeld 1_3_1:
  1. \`wcag-regels/Shift2_Regels_SC_<code>.md\` — de Shift2-beoordelingsregels. BINDEND: deze gaan vóór de checklist en vóór je eigen WCAG-interpretatie.
  2. \`wcag-checklists/Checklist_SC_<code>.md\` — de toetsingsinstructie
  3. \`wcag-checklists/Richtlijnen_Grensgevallen_SC_<code>.md\` — bestaat voor 1.1.1, 1.3.1, 2.4.4 en 2.4.6

Lees daarnaast \`wcag-regels/Shift2_Schrijfregels.md\` en toets elke description en advice daaraan: geen URL aan het begin, geen gedachtestreepjes, geen HTML-codeblokken, geen vindplaats-lijst, hulpsoftware LEEST VOOR (laat niets zien), "tekstalternatief" niet "tekstbeschrijving", maximaal twee a drie voorbeelden, en bij een opmerking impact en responsibility leeg.

Weerleg een oordeel expliciet als het in strijd is met een Shift2-regel. Typische gevallen: een afkeuring op een telefoonnummer- of e-maillink onder 2.4.4, een afkeuring op een teaser-afbeelding met alt="", of een afkeuring waar de regels een opmerking voorschrijven (zet dan gecorrigeerdeStatus op 'opmerking').

LET OP bij een niet-getagde PDF: weerleg een afkeuring van 1.3.2 (leesvolgorde). Zonder tags is er geen programmatische leesvolgorde om te toetsen, dus dat hoort 'niet_te_bepalen' te zijn, niet afgekeurd. De ontbrekende tag-structuur wordt al onder 1.3.1 afgekeurd; keur het gevolg niet apart af.

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
log(`Klaar. ${rapport.length} HTML-samples verwerkt. ${nieuweAfk.length} nieuwe afkeuringen, ${bestaandeAfk.length} overlappen met bestaande bevindingen. ${aantalVragen} vragen voor handmatige controle in de browser (${openVragenPerCriterium.length} criteria). ${gaten.length ? gaten.length + ' sample(s) met ontbrekende criteria!' : 'Geen enkel criterium overgeslagen.'}`)

return {
  onderzoekstype: context.researchTypeName,
  aantalHtmlSamples: rapport.length,
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
