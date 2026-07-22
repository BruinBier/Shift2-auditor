export const meta = {
  name: 'audit-samples',
  description: 'Per sample: audit alle succescriteria van het onderzoekstype, verifieer, en match tegen bestaande QuickFindings',
  whenToUse: 'Voor een WCAG-audit waarbij per sample-pagina elk succescriterium moet worden beoordeeld zonder dat er criteria worden overgeslagen. Levert een voorstel-rapport; schrijft niets naar de database.',
  phases: [
    { title: 'Voorbereiden', detail: 'Project, samples, SC-set en QuickFindings ophalen' },
    { title: 'Auditen', detail: 'Eén auditor-agent per sample gaat alle SC\'s af (verplichte checklist)' },
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
  required: ['researchTypeName', 'samples', 'criteria', 'quickFindings', 'existingFindings'],
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
    quickFindings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'criterionCode', 'description'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          criterionCode: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
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

3. \`curl -s "http://localhost:3000/api/quick-findings"\` — geef per QuickFinding id, title, criterionCode en de eerste ~200 tekens van description terug. Dit is de bibliotheek waartegen we later matchen.

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

// Alleen HTML-pagina's auditen: samples met een echte http(s)-URL. PDF/URL-loze
// samples slaan we over (die vereisen PAC-output die de workflow niet heeft).
const htmlSamples = context.samples.filter(
  (s) => typeof s.url === 'string' && /^https?:\/\//i.test(s.url),
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

// Optionele testlimiet: opts.maxSamples pakt alleen de eerste N HTML-samples.
const teAuditen =
  Number.isInteger(opts.maxSamples) && opts.maxSamples > 0
    ? htmlSamples.slice(0, opts.maxSamples)
    : htmlSamples

log(`${teAuditen.length} van ${htmlSamples.length} HTML-samples × ${context.criteria.length} criteria (onderzoekstype: ${context.researchTypeName}). ${overgeslagen.length} niet-HTML samples overgeslagen. ${context.existingFindings?.length || 0} bestaande bevindingen als referentie.`)

// Vaste, gesorteerde SC-lijst die aan ELKE auditor wordt meegegeven.
const scList = context.criteria
  .map((c) => `${c.code} (niveau ${c.level}) — ${c.titleNl}`)
  .join('\n')
const requiredCodes = context.criteria.map((c) => c.code)

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

HTML/screenshot ophalen (dev server draait):
  npm run cli -- get-html ${sample.url ? sample.url : '<url>'} --text     (leesbare tekst)
  npm run cli -- get-html ${sample.url ? sample.url : '<url>'}            (ruwe HTML)
  npm run cli -- get-screenshot ${sample.url ? sample.url : '<url>'} --full-page
Heeft de sample geen URL, beoordeel dan op basis van titel/type en zet twijfelgevallen op 'niet_te_bepalen'.

TE BEOORDELEN SUCCESCRITERIA (${requiredCodes.length} stuks — geef exact één assessment per code terug):
${scList}

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
    const teControleren = audit.assessments.filter(
      (a) => a.status === 'afgekeurd' || a.status === 'opmerking',
    )
    if (!teControleren.length) {
      return { sampleId: sample.id, audit, verify: { sampleId: sample.id, oordelen: [] } }
    }
    return agent(
      `Je bent een kritische WCAG-verifier. Een andere auditor beoordeelde sample "${sample.title}" (${sample.url || 'geen URL'}). Controleer UITSLUITEND de onderstaande afkeuringen en opmerkingen: klopt het oordeel, en is de beschrijving correct en niet overdreven? Probeer elk oordeel te weerleggen; bevestig alleen wat standhoudt.

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
    // Alleen QuickFindings van de betrokken criteria meesturen, scheelt ruis.
    const codes = new Set(relevante.map((a) => a.code))
    const relevanteQf = context.quickFindings.filter((qf) => codes.has(qf.criterionCode))
    return agent(
      `Bepaal per afgekeurd criterium of er AL een passende QuickFinding bestaat in de bibliotheek, zodat we geen duplicaat aanmaken.

AFKEURINGEN/OPMERKINGEN voor sample "${sample.title}":
${JSON.stringify(relevante.map((a) => ({ code: a.code, description: a.voorstelBevinding?.description })), null, 2)}

BESCHIKBARE QUICKFINDINGS (zelfde criteria):
${relevanteQf.length ? JSON.stringify(relevanteQf, null, 2) : '(geen QuickFindings voor deze criteria)'}

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

// Handmatige-check-todo: per pagina de criteria die een browsertest vereisen
// (contrast 1.4.3/1.4.11, reflow 1.4.10, toetsenbord 2.1.2/2.1.4, target-size 2.5.8,
// pauzeren 2.2.2). Deze loop je conform je werkwijze per pagina zelf na in de browser.
const handmatigeChecks = rapport
  .filter((r) => r.nietTeBepalen.length)
  .map((r) => ({
    sampleTitle: r.sampleTitle,
    url: r.url,
    teControlerenInBrowser: r.nietTeBepalen,
  }))

log(`Klaar. ${rapport.length} HTML-samples verwerkt. ${nieuweAfk.length} nieuwe afkeuringen, ${bestaandeAfk.length} overlappen met bestaande bevindingen. ${gaten.length ? gaten.length + ' sample(s) met ontbrekende criteria!' : 'Geen enkel criterium overgeslagen.'}`)

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
  rapport,
}
