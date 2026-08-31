export const meta = {
  name: 'audit-criterium',
  description:
    'Eén succescriterium beoordelen op de pagina\'s van de steekproef: per pagina een eigen agent die niets anders doet, daarna de bevindingen samenvoegen en wegschrijven als voorstel',
  whenToUse:
    'Als één criterium opnieuw of alsnog beoordeeld moet worden, los van de rest. Elke agent krijgt precies één criterium en één pagina, dus er valt niets af te dwalen naar een ander criterium. Voor criteria met deelgebieden (1.3.1, 1.4.3, 2.4.4) schrijft hij die verplicht mee: zonder complete lijst weigert save-checks het oordeel. Draai met args.drooglopen = true om alleen te rapporteren.',
  phases: [
    { title: 'Voorbereiden', detail: 'Auditsessie starten, project en regelbestand ophalen' },
    { title: 'Beoordelen', detail: 'Eén agent per pagina, strikt begrensd tot dit ene criterium' },
    { title: 'Samenvoegen', detail: 'Hetzelfde probleem op meerdere pagina\'s wordt één bevinding' },
    { title: 'Wegschrijven', detail: 'Oordelen opslaan en de bevindingen aanmaken als voorstel' },
  ],
}

/**
 * Waarom dit naast audit-samples bestaat.
 *
 * `audit-samples` zet één agent per PAGINA neer die alle dertig criteria afgaat. Dat is
 * efficiënt — de pagina wordt één keer opgehaald — maar het maakt niet zichtbaar of die
 * agent bij criterium zesentwintig nog even scherp was als bij criterium één. Hier is de
 * eenheid van werk het CRITERIUM: elke agent krijgt er precies één, plus één pagina, plus
 * het regelbestand dat erbij hoort. Wat hij daarbuiten ziet, laat hij liggen — daar draait
 * een andere agent voor.
 *
 * Dat kost meer paginabezoeken. Het levert een oordeel op waarvan te controleren is dat de
 * stappen gezet zijn, en dat is waar het bij het nakijken op aankomt.
 */

// args: { projectId, criterium, samples?: string[], homepageSampleId?, drooglopen? }
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
const criterium = opts.criterium
if (!projectId) throw new Error('args.projectId is verplicht.')
if (!criterium) throw new Error('args.criterium is verplicht, bijvoorbeeld "2.4.4".')

const codeMetStreepjes = String(criterium).replace(/\./g, '_')

/**
 * Zorgen dat er een auditsessie draait, vóór er iets gemeten wordt.
 *
 * De CLI valt stilzwijgend terug op headless — één regel op stderr, en de audit gaat gewoon
 * door. Achteraf staat er dan een oranje badge op de kaart, en dat is te laat: het werk is
 * al gedaan en het oordeel staat er al.
 *
 * Wat headless mist, mist het onzichtbaar. Uitklapblokken die pas na een klik in de code
 * komen, menu's, formulierstappen achter een sessie, een cookiemuur — die zien er niet uit
 * als een fout maar als een pagina waar dat allemaal niet op staat. Precies het patroon dat
 * op 15 augustus 2026 drie afkeuringen opleverde die geen van drieën bestonden.
 *
 * Draait er niets, dan start de workflow Chrome zelf. Dat is geen ingrijpende handeling: het
 * script gebruikt een eigen profiel (`chrome-audit-profile` in je home-map) en laat je gewone
 * Chrome met rust. Vragen of het mag zou de onderzoeker elke ronde dezelfde vraag stellen met
 * altijd hetzelfde antwoord.
 *
 * `headlessMag: true` slaat dit over — voor een openbare pagina zonder login of cookiemuur.
 */
phase('Voorbereiden')

const debugUrl = opts.debugUrl || 'http://localhost:9222'

/**
 * De controle doet een agent, niet dit script.
 *
 * `fetch` naar localhost mislukt hier: het script draait in een afgeschermde omgeving die
 * geen verbinding met de eigen machine krijgt. Op 2026-08-31 leverde dat het slechtst
 * denkbare antwoord op — de workflow zag een draaiende Chrome niet, startte er een tweede,
 * en concludeerde daarna dat die ook niet draaide. Een agent draait `curl` gewoon in de
 * shell en krijgt wel antwoord.
 */
const SESSIE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['draait', 'toelichting'],
  properties: {
    draait: { type: 'boolean' },
    gestart: { type: 'boolean' },
    toelichting: { type: 'string' },
  },
}

if (!opts.headlessMag) {
  // Een workflowscript kan zelf geen commando draaien; een agent wel.
  const sessie = await agent(
    `Zorg dat er een auditsessie-Chrome draait. Je werkdirectory is de repo-root.

1. Kijk of hij er al is:

     curl -s -m 3 ${debugUrl}/json/version

   Komt daar JSON uit met een "Browser"-veld, dan ben je klaar: \`draait\` is true en
   \`gestart\` false. Start dan NIETS — er staat al een Chrome met de sessies van de
   onderzoeker erin, en een tweede voegt niets toe.

2. Komt er niets uit, start hem dan:

     npm run cli:chrome-los

   Dat start Chrome met foutopsporing op poort 9222, met het eigen auditprofiel
   (\`chrome-audit-profile\` in de home-map, niet het gewone Chrome-profiel), en keert meteen
   terug — het blijft niet hangen.

3. Wacht daarna tot de poort antwoordt: herhaal het curl-commando uit stap 1, met een
   seconde ertussen, tot er JSON uitkomt of tot je het tien keer hebt geprobeerd.

Zet \`draait\` op wat er aan het eind werkelijk is, niet op wat je hoopte. Noem in
\`toelichting\` de Chrome-versie als hij draait, en anders wat het startcommando zei. Verzin
geen tweede manier om Chrome te starten.`,
    { label: 'auditsessie', phase: 'Voorbereiden', schema: SESSIE_SCHEMA },
  )

  if (!sessie?.draait) {
    return {
      error:
        `Er draait geen auditsessie op ${debugUrl}, dus alles zou headless gemeten worden. ` +
        `Start \`npm run chrome:debug\` met de hand en draai opnieuw. Volstaat headless voor ` +
        `${criterium} — openbare pagina, geen login, geen cookiemuur, geen uitklapblokken die ` +
        `ertoe doen — geef dan args.headlessMag = true mee.`,
      criterium,
      auditsessie: false,
      toelichting: sessie?.toelichting ?? null,
    }
  }
  log(
    `Auditsessie ${sessie.gestart ? 'gestart' : 'draaide al'} op ${debugUrl}. ${sessie.toelichting}`,
  )
}

// ---------------------------------------------------------------------------
// FASE 1 — Voorbereiden (de fase is hierboven al geopend, bij de auditsessie)
// ---------------------------------------------------------------------------

const CONTEXT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'criteriumId',
    'criteriumTitel',
    'criteriumNiveau',
    'samples',
    'deelgebieden',
    'heeftRegelbestand',
    'heeftChecklist',
    'heeftGrensgevallen',
    'bestaandeBevindingen',
    'afwijzingen',
  ],
  properties: {
    criteriumId: { type: 'string' },
    criteriumTitel: { type: 'string' },
    criteriumNiveau: { type: 'string' },
    samples: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // description is verplicht met null toegestaan: een optioneel veld laat een agent
        // graag weg, en juist daar staat wat er bijzonder is aan een pagina.
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
    // Leeg = dit criterium heeft geen deelgebieden, en dan hoeft er niets mee.
    deelgebieden: { type: 'array', items: { type: 'string' } },
    heeftRegelbestand: { type: 'boolean' },
    heeftChecklist: { type: 'boolean' },
    heeftGrensgevallen: { type: 'boolean' },
    bestaandeBevindingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'findingCode', 'sampleItemIds', 'description'],
        properties: {
          /**
           * Het uuid van de bevinding. Nodig om hem aan een deelgebied te hangen.
           *
           * Bij een herinspectie bestaan de bevindingen al: de agent zet `nieuw: false` en er
           * wordt niets aangemaakt, dus er komt ook geen id uit `create-finding`. Zonder dit
           * veld blijft zo'n bevinding voorgoed los van zijn gebied staan, terwijl de agent
           * precies weet waar hij hoort.
           */
          id: { type: 'string' },
          findingCode: { type: ['string', 'null'] },
          sampleItemIds: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
        },
      },
    },
    afwijzingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['reden', 'description'],
        properties: {
          reden: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
}

const samplesFilter = Array.isArray(opts.samples) && opts.samples.length
  ? `\n\nLET OP: neem ALLEEN de sample-items met deze id's op, in deze volgorde: ${opts.samples.join(', ')}. Laat de rest weg.`
  : ''

const context = await agent(
  `Je bent de scout voor een WCAG-audit van ÉÉN succescriterium. Verzamel read-only context via de audit-CLI (\`npm run cli -- <command>\`) en curl. De dev server draait al; je werkdirectory is de repo-root.

Project-id: ${projectId}
Criterium:  ${criterium}

1. \`npm run cli -- get-project ${projectId}\` — neem alle sampleItems op (id, title, url, sampleType, description). Neem de description letterlijk over: daar staat wat er bijzonder is aan een pagina, bijvoorbeeld dat hij alleen via een ingevuld formulier te bereiken is.${samplesFilter}

2. \`npm run cli -- list-criteria\` — zoek criterium ${criterium} op en geef zijn id, titel (titleNl) en niveau (level) terug. Zonder dat id kan er straks geen bevinding worden aangemaakt.

3. De deelgebieden van dit criterium. Die staan in het regelbestand, onder \`### Deelgebieden\`:
   \`\`\`
   awk '/^### Deelgebieden/{p=1;next} /^#{1,3} /{if(p)exit} p' wcag-regels/Shift2_Regels_SC_${codeMetStreepjes}.md
   \`\`\`
   Geef ze WOORDELIJK terug in \`deelgebieden\`, zonder het nummer en de punt ervoor, in de volgorde waarin ze staan. Die namen moeten letterlijk kloppen: straks worden ze zo weggeschreven, en een naam die één teken afwijkt wordt geweigerd. Bestaat het bestand niet of staat de kop er niet in, geef dan een lege array — dit criterium heeft dan geen deelgebieden en dat is geen fout.

4. Welke bronbestanden er zijn voor dit criterium. Gebruik \`test -f <pad> && echo ja || echo nee\`:
   - \`wcag-regels/Shift2_Regels_SC_${codeMetStreepjes}.md\` → heeftRegelbestand
   - \`wcag-checklists/Checklist_SC_${codeMetStreepjes}.md\` → heeftChecklist
   - \`wcag-checklists/Richtlijnen_Grensgevallen_SC_${codeMetStreepjes}.md\` → heeftGrensgevallen

5. \`curl -s "http://localhost:3000/api/projects/${projectId}/findings"\` — de bestaande bevindingen. Filter op criterium ${criterium} en splits:

   a) \`bestaandeBevindingen\`: status 'open', 'published', 'resolved' EN 'voorstel'. Per stuk: het \`id\` (uuid), de findingCode, de sampleItemIds (uit occurrences[].sampleItem.id of occurrences[].sampleItemId), en de eerste ~150 tekens van description. Het id is nodig om de bevinding aan een deelgebied te kunnen hangen; neem het letterlijk over. Voorstellen horen er nadrukkelijk bij: die wachten nog op akkoord, maar ze bestaan al. Laat je ze weg, dan komt dezelfde vondst er nog een keer bij.

   b) \`afwijzingen\`: status 'afgewezen'. Per stuk: het veld \`afwijzingsreden\` en de eerste ~120 tekens van description. Sla er een over als de afwijzingsreden leeg is; zonder reden valt er niets van te leren.

Geef puur de verzamelde data terug. Verzin niets; laat een lege array als iets niet bestaat.`,
  { label: `scout:${criterium}`, phase: 'Voorbereiden', schema: CONTEXT_SCHEMA },
)

if (!context || !context.samples?.length) {
  return { error: 'Geen sample-items gevonden voor dit project.', context }
}
if (!context.criteriumId) {
  return { error: `Criterium ${criterium} niet gevonden in de criterialijst.`, context }
}

// Alleen pagina's met een echt adres. Een sample zonder URL (handmatig genoteerd) valt
// buiten deze workflow: daar is niets op te halen en niets aan te meten.
const teBeoordelen = context.samples.filter(
  (s) => typeof s.url === 'string' && /^https?:\/\//i.test(s.url),
)
const zonderUrl = context.samples.filter((s) => !teBeoordelen.includes(s))

if (!teBeoordelen.length) {
  return { error: 'Geen sample-items met een bruikbaar adres.', samples: context.samples }
}

/**
 * Welke pagina de header en de footer meeneemt.
 *
 * Sitebrede onderdelen worden op één pagina beoordeeld en gelden dan voor de hele website.
 * Doet elke pagina dat, dan komt dezelfde bevinding twintig keer in het rapport. Zie
 * wcag-regels/Shift2_Scope_Per_Sample.md.
 */
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
const homepageSample = teBeoordelen.find(isHomepage) || null
if (!homepageSample) {
  log(
    `LET OP: geen homepage-sample herkend. Elke pagina wordt inclusief header en footer beoordeeld, wat sitebrede bevindingen dupliceert. Geef eventueel args.homepageSampleId mee.`,
  )
}

const isPdf = (s) => s.sampleType === 'pdf' || /\.pdf(\?|#|$)/i.test(s.url || '')

log(
  `${criterium} ${context.criteriumTitel} (${context.criteriumNiveau}) op ${teBeoordelen.length} pagina's` +
    `${zonderUrl.length ? `, ${zonderUrl.length} zonder adres overgeslagen` : ''}. ` +
    `${context.deelgebieden.length ? `${context.deelgebieden.length} deelgebieden — die zijn verplicht.` : 'Geen deelgebieden voor dit criterium.'} ` +
    `${context.bestaandeBevindingen.length} bestaande bevinding(en), ${context.afwijzingen.length} eerder afgewezen.`,
)

// ---------------------------------------------------------------------------
// FASE 2 — Beoordelen. Eén agent per pagina, en niets anders dan dit criterium.
// ---------------------------------------------------------------------------
phase('Beoordelen')

const OORDEEL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sampleId', 'sampleTitel', 'status', 'reden', 'deelgebieden', 'bevindingen'],
  properties: {
    sampleId: { type: 'string' },
    sampleTitel: { type: 'string' },
    status: {
      type: 'string',
      enum: ['voldoet', 'afgekeurd', 'opmerking', 'niet_aanwezig', 'niet_te_bepalen'],
    },
    reden: { type: 'string' },
    deelgebieden: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['gebied', 'uitkomst', 'toelichting'],
        properties: {
          gebied: { type: 'string' },
          uitkomst: { type: 'string', enum: ['ok', 'nvt', 'fout', 'opmerking'] },
          toelichting: { type: ['string', 'null'] },
          /**
           * De id's van BESTAANDE bevindingen die bij dit gebied horen.
           *
           * Alleen voor bevindingen die er al zijn — die krijgen geen nieuw voorstel, dus er
           * komt geen id uit `create-finding`. Voor wat je zelf aanmaakt hoef je hier niets te
           * doen: dat loopt via `gebieden` op de bevinding zelf.
           */
          bevindingen: { type: 'array', items: { type: 'string' } },
          /**
           * De selector per bestaand bevinding-id: `{"<uuid>": "header .logo img"}`.
           * Alleen voor de id's die hierboven in `bevindingen` staan.
           */
          aanwijzingen: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    },
    bevindingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // `gebieden` staat er bewust bij als verplicht: een optioneel veld laat een agent
        // graag weg, en dan is de koppeling er niet. Heeft het criterium geen deelgebieden,
        // dan is een lege array het antwoord.
        required: [
          'type',
          'description',
          'advice',
          'impact',
          'responsibility',
          'nieuw',
          'gebieden',
          'selector',
        ],
        properties: {
          type: { type: 'string', enum: ['bevinding', 'opmerking'] },
          description: { type: 'string' },
          advice: { type: 'string' },
          impact: {
            type: ['string', 'null'],
            enum: ['klein', 'matig', 'serieus', 'kritiek', 'onbekend', null],
          },
          responsibility: {
            type: ['string', 'null'],
            enum: ['redacteur', 'ontwikkelaar', 'ontwerper', 'onbekend', null],
          },
          // Bestaat er al een bevinding over ditzelfde? Dan geen tweede.
          nieuw: { type: 'boolean' },
          /**
           * Bij welk deelgebied hoort deze bevinding? De naam woordelijk.
           *
           * Zonder dit staat een gebied op `fout` op de kaart los van de afkeuring die erover
           * gaat, en moet de onderzoeker zelf verbinden wat bij elkaar hoort. Meestal één
           * gebied; hoort hij er echt bij twee, noem ze dan allebei.
           */
          gebieden: { type: 'array', items: { type: 'string' } },
          /**
           * Waar op de pagina het probleem zit, als CSS-selector.
           *
           * De kaart zet er een kader omheen als de onderzoeker bij deze bevinding op "Wijs
           * het aan in de browser" klikt. Zonder selector krijgt hij de kaders van het hele
           * criterium, en dan moet hij zelf zoeken welke daarvan deze bevinding is.
           */
          selector: { type: ['string', 'null'] },
        },
      },
    },
    // Wat je niet kon vaststellen en waarom. Leeg is goed nieuws.
    openVragen: { type: 'array', items: { type: 'string' } },
  },
}

const bronnen = [
  context.heeftChecklist
    ? `  1. \`wcag-checklists/Checklist_SC_${codeMetStreepjes}.md\` — de toetsingsinstructie: definitie, beslisboom, auditgebieden, voorbeelden`
    : null,
  context.heeftGrensgevallen
    ? `  2. \`wcag-checklists/Richtlijnen_Grensgevallen_SC_${codeMetStreepjes}.md\` — de randgevallen`
    : null,
  context.heeftRegelbestand
    ? `  3. \`wcag-regels/Shift2_Regels_SC_${codeMetStreepjes}.md\` — de vastgelegde Shift2-voorkeuren. BINDEND: die gaan vóór de checklist en vóór je eigen WCAG-interpretatie als ze elkaar tegenspreken.`
    : null,
]
  .filter(Boolean)
  .join('\n')

const gebiedenSectie = context.deelgebieden.length
  ? `\n\nDE DEELGEBIEDEN — ALLE ${context.deelgebieden.length} LANGSLOPEN
Dit criterium bestaat uit meerdere losse vragen. Je oordeel wordt GEWEIGERD als je ze niet alle ${context.deelgebieden.length} beantwoordt; dat is geen formaliteit maar de enige manier waarop de onderzoeker kan zien dat je niets hebt overgeslagen. Een verhaal dat een gebied weglaat leest hetzelfde als een verhaal dat er niets over te melden had.

Geef per gebied een uitkomst:
  ok        — nagelopen, in orde
  nvt       — komt op deze pagina niet voor (zeg in de toelichting waaróp je hebt gezocht)
  fout      — hier zit een afkeuring; toelichting VERPLICHT
  opmerking — geen afkeuring, wel iets te melden; toelichting VERPLICHT

Kun je een gebied niet beoordelen, gebruik dan \`nvt\` met een toelichting die zegt waarom.
Dát je het niet kon is de informatie die een lopende onderbouwing weglaat — verzin geen 'ok'.

Neem de namen WOORDELIJK over:
${context.deelgebieden.map((g) => `  - ${g}`).join('\n')}`
  : ''

const afwijzingenSectie = context.afwijzingen.length
  ? `\n\nEERDER AFGEWEZEN — stel deze niet opnieuw voor
${context.afwijzingen.map((a) => `  - ${a.description} → afgewezen omdat: ${a.reden}`).join('\n')}`
  : ''

const bestaandeSectie = context.bestaandeBevindingen.length
  ? `\n\nBESTAANDE BEVINDINGEN OP DIT CRITERIUM
Gaat jouw vondst over hetzelfde, zet \`nieuw\` dan op false — dan wordt er geen tweede aangemaakt.
${context.bestaandeBevindingen
    .map(
      (b) =>
        `  - ${b.findingCode || '(geen code)'} (id ${b.id}) op ${b.sampleItemIds.length} pagina('s): ${b.description}`,
    )
    .join('\n')}${
      context.deelgebieden.length
        ? `

Hoort een bestaande bevinding bij een deelgebied dat jij op \`fout\` of \`opmerking\` zet, zet
zijn id dan in \`bevindingen\` van dat gebied — het uuid uit de lijst hierboven, letterlijk.
Zo staat hij op de kaart onder het gebied waar hij over gaat, ook al maak je hem niet opnieuw
aan. Zonder dat blijft hij los onderaan staan terwijl jij precies weet waar hij hoort.

Zet er ook een selector bij, in \`aanwijzingen\` van datzelfde gebied: \`{"<uuid>": "header
.logo img"}\`. Daarmee wijst de kaart het element aan in plaats van kaders om het hele
criterium te zetten. Weet je geen betrouwbare selector, laat het dan weg — iets wat het
verkeerde aanwijst is erger dan niets.`
        : ''
    }`
  : ''

const oordelen = await pipeline(
  teBeoordelen,
  (sample) => {
    const homepage = homepageSample && sample.id === homepageSample.id
    const scope = homepage
      ? `Dit is het homepage-sample. Beoordeel de HELE pagina: header, main-content en footer. Sitebrede onderdelen (logo, hoofdnavigatie, toegankelijkheidsbalk, footer) worden ALLEEN hier beoordeeld en gelden daarmee voor de hele website.`
      : `Dit is GEEN homepage-sample. Beoordeel UITSLUITEND de main-content.

Sla header, sitebrede navigatie, toegankelijkheidsbalk en footer volledig over — ook als je daar iets ziet dat fout is. Die onderdelen zijn op elke pagina gelijk en worden op het homepage-sample${homepageSample ? ` ("${homepageSample.title}")` : ''} beoordeeld; rapporteer je ze hier ook, dan komt dezelfde bevinding meerdere keren in het rapport.

Afbakening: het \`main\`-element, of als dat ontbreekt het gebied tussen de sitebrede navigatie en de footer. Zit dit criterium volledig in header of footer en heeft de main-content er niets van, zet het dan op \`niet_aanwezig\` met als reden dat het buiten de main-content valt.`

    return agent(
      `Je bent WCAG-auditor. Je beoordeelt ÉÉN succescriterium op ÉÉN pagina. Meer niet.

HET CRITERIUM
  ${criterium} — ${context.criteriumTitel} (niveau ${context.criteriumNiveau})

DE PAGINA
  id:    ${sample.id}
  titel: ${sample.title}
  url:   ${sample.url}
  type:  ${sample.sampleType}${
    sample.description
      ? `

WAT ER OVER DEZE PAGINA IS VASTGELEGD — lees dit voordat je begint:
  ${sample.description}`
      : ''
  }

WAT JE VAN DEZE PAGINA BEOORDEELT
${scope}

BLIJF BIJ DIT ENE CRITERIUM
Zie je iets dat onder een ander succescriterium valt, laat het dan liggen. Daar draait een
eigen agent voor. Elke regel aandacht die naar iets anders gaat, gaat niet naar de vraag die
jou is gesteld — en de onderzoeker kan straks niet meer zien of je je eigen werk hebt
afgemaakt.

BRONNEN — VERPLICHT LEZEN VOORDAT JE BEGINT
Beoordeel niet uit je hoofd. Lees met je Read-tool (werkdirectory is de repo-root):
${bronnen || '  (geen criteriumspecifieke bestanden gevonden — beoordeel op de WCAG-tekst en vermeld dat in je reden)'}

Lees daarnaast eenmalig:
  - \`wcag-regels/Shift2_Scope_Per_Sample.md\` — welk deel van de pagina je beoordeelt
  - \`wcag-regels/Shift2_Bewijsvoering.md\` — waarop een oordeel mag rusten. Begin hiermee: het schrijft voor dat je de pagina opent zonder opmaak en eerst controleert of je op de gevraagde pagina bent uitgekomen.
  - \`wcag-regels/Shift2_Voldoet_Of_Niet_Aanwezig.md\` — wanneer iets gehaald is en wanneer het niet van toepassing is. Dat verschil gaat vaak mis in beide richtingen.
  - \`wcag-regels/Shift2_Schrijfregels.md\` — bindend voor elke bevindingstekst

MEET, VRAAG NIET
Kijk in \`lib/metingen.ts\` welk commando bij ${criterium} hoort en draai dat. De pagina haal
je op met \`npm run cli -- get-html <url>\` en \`npm run cli -- get-screenshot <url>\`; die
draaien een echte browser, dus de JavaScript van de site werkt. Gebruik nooit een ingebouwd
browserpaneel: daar hydrateert React niet, en een knop die niets doet ziet er precies zo uit
als een echte bevinding.

Geeft \`get-html\` \`gehydrateerd: false\` terug, trek dan geen conclusies over toetsenbord,
menu's, schakelknoppen of zoeksuggesties — meld dat in \`openVragen\`.${
        isPdf(sample)
          ? `

DIT IS EEN PDF. Beoordeel de documentstructuur, niet de DOM. Getagd of niet is machinaal vast
te stellen. Is het document niet getagd, dan vervallen 1.3.2, 1.4.5 en 3.2.4, en wordt 1.1.1
een opmerking; 2.4.4 en 2.4.6 beoordeel je juist wél visueel.`
          : ''
      }${gebiedenSectie}

HET OORDEEL
  voldoet          — nagelopen en in orde
  afgekeurd        — er is minstens één afkeuring; schrijf die als bevinding
  opmerking        — geen afkeuring, wel iets te melden
  niet_aanwezig    — het criterium is hier niet van toepassing. Zeg waaróp je hebt gezocht: een leeg resultaat en een mislukte zoekactie zien er in een onderbouwing hetzelfde uit.
  niet_te_bepalen  — je kon het niet vaststellen; zeg in \`openVragen\` wat de onderzoeker moet doen

DE ONDERBOUWING (\`reden\`) — HOUD HEM KORT
Daarin horen de afwegingen bij grensgevallen, en wat jij zag dat het meetcommando niet ziet.
NIET wat de meting al telde — dat staat bij het oordeel met een aantal erbij.
NIET de opsomming van wat in orde was — dat zijn de deelgebieden hierboven.
NIET de afkeuring zelf — die staat in de bevinding.
Drie, vier zinnen is genoeg.

DE BEVINDINGEN
Schrijf ze volgens \`wcag-regels/Shift2_Schrijfregels.md\`. Bij type \`bevinding\` horen impact
en responsibility; bij type \`opmerking\` laat je beide op null.${
        context.deelgebieden.length
          ? `

Zet bij elke bevinding in \`gebieden\` bij welk deelgebied hij hoort, met de naam woordelijk
zoals hierboven. Dan staat de bevinding op de kaart onder het gebied waar hij over gaat, in
plaats van in een losse lijst waarin de onderzoeker zelf moet verbinden wat bij elkaar hoort.
Meestal is dat er één. Hoort hij er echt bij twee — het gaat om hetzelfde probleem gezien
vanuit twee gebieden — noem ze dan allebei; de kaart toont hem dan één keer en verwijst bij
het tweede.

Elk gebied dat je op \`fout\` of \`opmerking\` zet, hoort in minstens één bevinding terug te
komen. Kun je geen bevinding schrijven, dan is het gebied waarschijnlijk geen \`fout\`.

Zet in \`selector\` een CSS-selector die het element aanwijst waar de bevinding over gaat, zoals
\`header .logo img\` of \`footer a[href*="facebook"]\`. De onderzoeker klikt dan één keer en ziet
een kader om precies dat element, in plaats van kaders om alles wat onder dit criterium valt.
Kies iets dat overeind blijft: een class of een attribuut liever dan \`div:nth-child(7) > span\`.
Gaat de bevinding over meerdere elementen, geef dan een selector die ze alle raakt.

Weet je geen betrouwbare selector, zet dan \`null\`. Een selector die het verkeerde aanwijst is
erger dan geen: dan kijkt de onderzoeker naar het verkeerde element en denkt dat hij het goede
ziet.`
          : ''
      }${bestaandeSectie}${afwijzingenSectie}

Geef je oordeel terug in het schema. Verzin niets: wat je niet hebt kunnen vaststellen, zeg je.`,
      {
        label: `${criterium}:${sample.title}`,
        phase: 'Beoordelen',
        schema: OORDEEL_SCHEMA,
      },
    )
  },
)

const geldig = oordelen.filter(Boolean)
if (!geldig.length) {
  return { error: 'Geen enkele pagina leverde een oordeel op.', criterium }
}

const mislukt = teBeoordelen.length - geldig.length
if (mislukt > 0) {
  log(`LET OP: ${mislukt} van de ${teBeoordelen.length} pagina's leverde geen oordeel op.`)
}

/**
 * Ontbrekende deelgebieden nu al melden, niet pas bij het wegschrijven.
 *
 * save-checks weigert zo'n oordeel, en dan staat er verderop een foutmelding zonder dat
 * iemand weet welke agent zijn werk niet afmaakte.
 */
if (context.deelgebieden.length) {
  for (const o of geldig) {
    const gedaan = new Set((o.deelgebieden || []).map((g) => g.gebied))
    const open = context.deelgebieden.filter((g) => !gedaan.has(g))
    if (open.length) {
      log(
        `LET OP: "${o.sampleTitel}" mist ${open.length} van de ${context.deelgebieden.length} deelgebieden (${open.join(', ')}). Dat oordeel wordt geweigerd.`,
      )
    }
  }
}

const alleBevindingen = geldig.flatMap((o) =>
  (o.bevindingen || [])
    .filter((b) => b.nieuw)
    .map((b) => ({ ...b, sampleId: o.sampleId, sampleTitel: o.sampleTitel })),
)

log(
  `${geldig.length} pagina's beoordeeld: ${geldig.filter((o) => o.status === 'afgekeurd').length} afgekeurd, ` +
    `${geldig.filter((o) => o.status === 'voldoet').length} voldoet, ` +
    `${geldig.filter((o) => o.status === 'niet_aanwezig').length} niet aanwezig, ` +
    `${geldig.filter((o) => o.status === 'niet_te_bepalen').length} niet te bepalen. ` +
    `${alleBevindingen.length} nieuwe bevinding(en) voor het samenvoegen.`,
)

// ---------------------------------------------------------------------------
// FASE 3 — Samenvoegen. Hetzelfde probleem op tien pagina's is één bevinding.
// ---------------------------------------------------------------------------
phase('Samenvoegen')

/**
 * Waarom dit een eigen agent is en geen regel in de vorige.
 *
 * Elke pagina-agent ziet alleen zijn eigen pagina; geen van hen kan weten dat dezelfde
 * footerlink op tien andere pagina's net zo staat. Dit is het enige moment waarop alle
 * bevindingen naast elkaar liggen — en zonder dat moment komt dezelfde bevinding tien keer
 * in het rapport. Zie de Shift2-regel over sitebrede bevindingen: één sample, met de zin dat
 * het patroon op alle pagina's aanwezig is.
 */
const SAMENVOEG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['bevindingen'],
  properties: {
    bevindingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'type',
          'description',
          'advice',
          'impact',
          'responsibility',
          'sampleIds',
          'gebieden',
          'selector',
        ],
        properties: {
          type: { type: 'string', enum: ['bevinding', 'opmerking'] },
          description: { type: 'string' },
          advice: { type: 'string' },
          impact: {
            type: ['string', 'null'],
            enum: ['klein', 'matig', 'serieus', 'kritiek', 'onbekend', null],
          },
          responsibility: {
            type: ['string', 'null'],
            enum: ['redacteur', 'ontwikkelaar', 'ontwerper', 'onbekend', null],
          },
          // Waar hij aan gehangen wordt. Bij een sitebreed patroon: alleen de pagina waar
          // je hem beschrijft, met de zin erbij dat het overal zo is.
          sampleIds: { type: 'array', items: { type: 'string' } },
          /**
           * De deelgebieden waar deze bevinding bij hoort, woordelijk.
           *
           * Komt uit de pagina-agents; bij het samenvoegen blijft hij staan. Voeg je twee
           * bevindingen samen die bij verschillende gebieden hoorden, neem dan beide namen
           * op.
           */
          gebieden: { type: 'array', items: { type: 'string' } },
          /** De selector uit de pagina-agent; bij samenvoegen die van de eerste, of een die ze alle raakt. */
          selector: { type: ['string', 'null'] },
        },
      },
    },
    // Wat er is samengevoegd, voor het overzicht aan het eind.
    samengevoegd: { type: 'array', items: { type: 'string' } },
  },
}

const samengevoegd = alleBevindingen.length
  ? await agent(
      `Je legt de bevindingen van ${criterium} naast elkaar en haalt de dubbelingen eruit. Dit is het enige moment waarop ze allemaal naast elkaar liggen: elke pagina is door een eigen agent beoordeeld, en geen van hen kon zien dat dezelfde fout elders net zo staat.

CRITERIUM: ${criterium} — ${context.criteriumTitel}

DE BEVINDINGEN, PER PAGINA
${JSON.stringify(alleBevindingen, null, 1)}

WAT JE DOET

1. Zoek bevindingen die over HETZELFDE probleem gaan. Niet "lijkt op elkaar" maar: dezelfde
   oorzaak, hetzelfde advies, dezelfde oplossing. Voeg die samen tot één bevinding.

2. Is een probleem op alle of bijna alle pagina's aanwezig, dan is het een SITEBREED patroon.
   Schrijf het dan als één bevinding, gehangen aan één pagina, met een slotzin in de trant van
   "Dit patroon is op alle pagina's van de website aanwezig." Zet dan alleen die ene pagina in
   \`sampleIds\`. Zonder die zin lijkt het een incident op één pagina; met tien losse
   bevindingen staat hetzelfde tien keer in het rapport.

3. Zit hetzelfde probleem op een handvol pagina's maar niet overal, hang de bevinding dan aan
   die pagina's: alle betrokken id's in \`sampleIds\`, één bevinding.

4. Blijft een bevinding echt op zichzelf staan, laat hem dan zoals hij is.

5. Voeg NOOIT samen wat verschillende oorzaken heeft, ook niet als de tekst lijkt. Twee
   bevindingen die een ander advies nodig hebben, zijn twee bevindingen.

REGELS VOOR DE TEKST
Lees \`wcag-regels/Shift2_Schrijfregels.md\` en houd je eraan — ook bij het herschrijven van
een samengevoegde tekst. Let in het bijzonder op: begin niet met de URL, geen
gedachtestreepjes, hulpsoftware leest voor (nooit "laat zien"), maximaal twee of drie
voorbeelden, en geen lange opsomming van vindplaatsen (de sample-items tonen die al).

Bij type \`bevinding\` horen impact en responsibility; bij \`opmerking\` blijven beide null.

Neem \`gebieden\` over uit de bevindingen die je samenvoegt: dat is het deelgebied waar de
bevinding bij hoort, en daarmee komt hij op de kaart onder dat gebied te staan in plaats van
in een losse lijst. Voeg je twee bevindingen samen die bij verschillende gebieden hoorden,
neem dan beide namen op. Verzin geen gebiedsnamen: gebruik wat er staat, woordelijk.

Zet in \`samengevoegd\` één regel per samenvoeging, zodat de onderzoeker ziet wat er is
samengetrokken. Bijvoorbeeld: "6 bevindingen over sociale-media-links samengevoegd tot één
sitebrede bevinding".`,
      { label: `samenvoegen:${criterium}`, phase: 'Samenvoegen', schema: SAMENVOEG_SCHEMA },
    )
  : { bevindingen: [], samengevoegd: [] }

const teSchrijven = samengevoegd?.bevindingen ?? []
if (alleBevindingen.length) {
  log(
    `${alleBevindingen.length} bevinding(en) samengetrokken tot ${teSchrijven.length}.` +
      (samengevoegd?.samengevoegd?.length ? ` ${samengevoegd.samengevoegd.join(' · ')}` : ''),
  )
}

// ---------------------------------------------------------------------------
// FASE 4 — Wegschrijven
// ---------------------------------------------------------------------------
if (opts.drooglopen) {
  log('Drooglopen: er wordt niets weggeschreven.')
  return {
    criterium,
    criteriumTitel: context.criteriumTitel,
    drooggelopen: true,
    oordelen: geldig,
    bevindingen: teSchrijven,
  }
}

phase('Wegschrijven')

/**
 * De oordelen gaan in één bericht, met de deelgebieden erin.
 *
 * Niet los via `save-gebieden`: die route eist een bestaand oordeel, dus dan zou de agent
 * eerst iets moeten opslaan wat vervolgens geweigerd wordt. Oordeel en verantwoording zijn
 * één handeling, of geen. Zie app/api/projects/[id]/criterion-checks/route.ts.
 *
 * HIER STAAT BEWUST GEEN `koppel-logboek`. Dat commando werkt projectbreed: het schrijft ALLE
 * oordelen van het project opnieuw weg om er het meetspoor aan te hangen, en het kent geen
 * filter op criterium. In `audit-samples` is dat goed — daar draait de hele audit. Hier niet:
 * op 2026-08-31 liet één run voor 1.1.1 op Home zes oordelen van ándere criteria weigeren,
 * omdat die hun deelgebieden niet hadden. Die oordelen bleven staan, maar hun meetspoor werd
 * niet bijgewerkt. Draai het commando apart als de hele ronde klaar is.
 */
/**
 * Welke bevinding bij welk gebied hoort, per sample — als plaatshouder.
 *
 * De koppeling loopt via de findingCode (V001, B001), en die bestaat pas nadat het voorstel
 * is aangemaakt. Daarom staat hier `@1` voor het eerste punt uit de lijst, `@2` voor het
 * tweede; de schrijf-agent vervangt ze door de codes die hij terugkrijgt. Zou het script de
 * codes zelf willen invullen, dan moest het eerst de API bevragen — en dat kan het niet.
 */
const gebiedCodes = (sampleId, gebied, alBestaand, alAanwijzingen) => {
  const nieuw = teSchrijven
    .map((b, i) => ({ b, plaats: `@${i + 1}` }))
    .filter(
      ({ b }) =>
        (b.sampleIds || []).includes(sampleId) && (b.gebieden || []).includes(gebied),
    )
    .map(({ plaats }) => plaats)
  // Bestaande bevindingen hebben hun id al; die hoeven geen plaatshouder. Bij een
  // herinspectie is dat de normale situatie: er wordt niets aangemaakt, en zonder deze
  // helft bleef elke bevinding los van zijn gebied staan.
  const samen = [...new Set([...(alBestaand || []), ...nieuw])]
  if (!samen.length) return {}

  // De selectors, met dezelfde plaatshouder als sleutel. De schrijf-agent vervangt die
  // plaatshouders overal waar ze staan, dus ook hier.
  // Bestaande bevindingen hebben hun uuid al als sleutel; nieuwe krijgen de plaatshouder.
  const aanwijzingen = { ...(alAanwijzingen || {}) }
  for (const [i, b] of teSchrijven.entries()) {
    const plaats = `@${i + 1}`
    if (!samen.includes(plaats)) continue
    if (b.selector) aanwijzingen[plaats] = b.selector
  }

  return {
    bevindingen: samen,
    ...(Object.keys(aanwijzingen).length ? { aanwijzingen } : {}),
  }
}

const checks = geldig.map((o) => ({
  sampleItemId: o.sampleId,
  criterionCode: criterium,
  status: o.status,
  reden: o.reden || null,
  ...(context.deelgebieden.length
    ? {
        gebieden: (o.deelgebieden || []).map((g) => ({
          gebied: g.gebied,
          uitkomst: g.uitkomst,
          ...(g.toelichting ? { toelichting: g.toelichting } : {}),
          ...gebiedCodes(o.sampleId, g.gebied, g.bevindingen, g.aanwijzingen),
        })),
      }
    : {}),
}))

const SCHRIJF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['oordelenGeschreven', 'oordelenOvergeslagen', 'voorstellen', 'problemen'],
  properties: {
    oordelenGeschreven: { type: 'number' },
    oordelenOvergeslagen: { type: 'number' },
    voorstellen: { type: 'array', items: { type: 'string' } },
    problemen: { type: 'array', items: { type: 'string' } },
  },
}

const uitkomst = await agent(
  `Schrijf de uitkomsten van ${criterium} weg met de audit-CLI. De dev server draait; je werkdirectory is de repo-root.

STAP 1 — de bevindingen als voorstel.
${
  teSchrijven.length === 0
    ? 'Er zijn geen nieuwe bevindingen. Sla deze stap over en geef een lege lijst terug.'
    : `Maak per punt hieronder een APART voorstel aan:

  npm run cli -- create-finding ${projectId} --criterion=${context.criteriumId} --description="..." --advice="..." --status=voorstel --sample-items=<id1>,<id2> [--impact=...] [--responsibility=...]

Let op:
  - Er staan ${teSchrijven.length} punten in de lijst; maak er dus ${teSchrijven.length} aan. Voeg ze NIET samen — dat is hiervoor al gedaan.
  - \`--criterion=${context.criteriumId}\` is voor elk voorstel hetzelfde: dit is de id van ${criterium}.
  - \`--sample-items\` krijgt de id's uit \`sampleIds\` van dat punt, met komma's ertussen.
  - \`--status=voorstel\` is verplicht. Een voorstel telt nergens mee tot de onderzoeker akkoord geeft; maak dus geen bevinding met status open.
  - Bij type 'bevinding' geef je ZOWEL --impact als --responsibility mee. Bij type 'opmerking' laat je ze allebei weg.
  - Gebruik \`--skip-lint\` NIET. Klaagt de schrijfregel-linter, pas dan de tekst aan volgens \`wcag-regels/Shift2_Schrijfregels.md\` en probeer opnieuw.
  - **Noteer per punt het \`id\` dat je terugkrijgt** — het uuid, niet de code. Dat heb je in stap 2 nodig. De code verandert bij goedkeuring (V001 wordt B00x uit een andere reeks); het id verandert nooit.

DE PUNTEN:
${JSON.stringify(teSchrijven, null, 1)}`
}

STAP 2 — de oordelen.
Schrijf onderstaande JSON naar een tijdelijk bestand (in \`tmp/\`, maak die map zo nodig aan) en pijp het naar de CLI:

  npm run cli -- save-checks ${projectId} --bron=workflow < tmp/<jouw-bestand>.json

Let op de codering: schrijf het bestand als UTF-8 zonder BOM. De gebiedsnamen bevatten
gedachtestreepjes en accolades; een naam die één teken afwijkt wordt geweigerd.
${
  // Ook zonder nieuwe bevindingen: bij een herinspectie staan er alleen bestaande id's in
  // het `bevindingen`-veld, en die moeten blijven staan. Zonder deze uitleg ziet de agent een
  // veld dat hij niet kent.
  context.deelgebieden.length
    ? `
**Vul eerst de id's in.** In de JSON hieronder staat bij sommige deelgebieden een veld
\`bevindingen\`. Daar kunnen twee dingen in staan:

  - een plaatshouder \`"@1"\`, \`"@2"\` — dat verwijst naar het eerste, tweede punt uit stap 1.
    Vervang die door het \`id\` (uuid) dat je bij dat punt terugkreeg, NIET de code.
  - een uuid — dat is een bevinding die al bestond. Laat die staan zoals hij is.

Dezelfde plaatshouders kunnen ook als SLEUTEL voorkomen, in een veld \`aanwijzingen\` naast
\`bevindingen\`: \`{"@1": "header .logo img"}\`. Vervang ook daar de sleutel door het uuid, en
laat de waarde ongemoeid — dat is de CSS-selector waarmee de kaart het element aanwijst.

Het id en niet de code, omdat de code verandert: een voorstel heet V001 en wordt bij
goedkeuring B00x uit een andere reeks. Een koppeling op de code gaat dus stuk op het moment
dat de onderzoeker akkoord geeft.

Zonder die koppeling staat een gebied op \`fout\` op de kaart los van de bevinding die erover
gaat, en moet de onderzoeker zelf verbinden wat bij elkaar hoort. Verzin geen id's: lukte een
voorstel niet, laat de plaatshouder dan wég en meld het bij "problemen".
`
    : ''
}
Controleer het antwoord: "geschreven" hoort ${checks.length} te zijn en "overgeslagen" 0.
${
  context.deelgebieden.length
    ? `Dit criterium heeft ${context.deelgebieden.length} deelgebieden en die zijn verplicht — staat er een oordeel bij dat niet compleet is, dan wordt precies dat oordeel geweigerd met de ontbrekende namen erbij. Verzin dan GEEN uitkomsten om het langs de controle te krijgen: meld het bij "problemen", want dat betekent dat een agent zijn werk niet heeft afgemaakt.`
    : ''
}
Ging er iets mis, meld dat dan letterlijk bij "problemen"; probeer het niet opnieuw met andere waarden.

DE OORDELEN:
${JSON.stringify(checks, null, 1)}

Geef terug hoeveel oordelen zijn weggeschreven, hoeveel er zijn overgeslagen, de codes van de aangemaakte voorstellen, en wat er misging.`,
  { label: `schrijf:${criterium}`, phase: 'Wegschrijven', schema: SCHRIJF_SCHEMA },
)

// ---------------------------------------------------------------------------
// Het overzicht: wat is er gebeurd, en waar moet de onderzoeker kijken.
// ---------------------------------------------------------------------------
const openVragen = geldig.flatMap((o) =>
  (o.openVragen || []).map((v) => `${o.sampleTitel}: ${v}`),
)

const teZien = geldig
  .filter((o) => o.status === 'afgekeurd' || o.status === 'opmerking' || o.status === 'niet_te_bepalen')
  .map((o) => o.sampleTitel)

log(
  `Klaar. ${uitkomst?.oordelenGeschreven ?? 0} oordelen weggeschreven` +
    `${uitkomst?.oordelenOvergeslagen ? `, ${uitkomst.oordelenOvergeslagen} GEWEIGERD` : ''}. ` +
    `${uitkomst?.voorstellen?.length ?? 0} voorstel(len) aangemaakt. ` +
    `${openVragen.length ? `${openVragen.length} open vraag/vragen.` : 'Geen open vragen.'} ` +
    `Het meetspoor is nog niet gekoppeld — draai \`npm run cli -- koppel-logboek ${projectId}\` als je klaar bent met deze ronde.`,
)

return {
  criterium,
  criteriumTitel: context.criteriumTitel,
  paginasBeoordeeld: geldig.length,
  paginasZonderOordeel: mislukt,
  oordelen: geldig.map((o) => ({
    sample: o.sampleTitel,
    status: o.status,
    deelgebieden: context.deelgebieden.length
      ? `${(o.deelgebieden || []).length}/${context.deelgebieden.length}`
      : null,
  })),
  bevindingenVoorSamenvoegen: alleBevindingen.length,
  bevindingenNa: teSchrijven.length,
  samengevoegd: samengevoegd?.samengevoegd ?? [],
  oordelenGeschreven: uitkomst?.oordelenGeschreven ?? 0,
  oordelenGeweigerd: uitkomst?.oordelenOvergeslagen ?? 0,
  voorstellen: uitkomst?.voorstellen ?? [],
  problemen: uitkomst?.problemen ?? [],
  openVragen,
  // Waar je moet kijken: de kaarten waar iets te beslissen valt.
  kaartenOmNaTeKijken: teZien,
}
