export const meta = {
  name: 'steekproef-samenstellen',
  description:
    "Uit één website een steekproef samenstellen: kandidaatpagina's zoeken, per pagina vaststellen welke contenttypen erop staan, en de kortste lijst kiezen die alles dekt",
  whenToUse:
    'Bij een nieuw onderzoek waarvan de steekproef nog leeg is. Leest eerst de planning (wat de klant heeft aangedragen, wat buiten scope valt), haalt dan de sitemap op, bekijkt de kandidaten en stelt een steekproef voor. De samples komen er als voorstel in: audit-samples weigert te starten tot de onderzoeker ze per pagina heeft goedgekeurd. Draai met args.drooglopen = true om alleen te rapporteren.',
  phases: [
    { title: 'Planning lezen', detail: "Scope, aangedragen pagina's en onderzoekstype uit het project" },
    { title: 'Kandidaten zoeken', detail: 'Sitemap ophalen, anders de crawler' },
    { title: "Pagina's bekijken", detail: 'Per pagina vaststellen welke contenttypen erop staan' },
    { title: 'Steekproef kiezen', detail: 'De kortste lijst die alle aanwezige gebieden dekt' },
    { title: 'Wegschrijven', detail: 'Samples aanmaken als voorstel, in de voorgeschreven volgorde' },
  ],
}

/**
 * Waarom dit een workflow is en geen gesprek.
 *
 * Een steekproef bepaalt waar gekeken wordt. Wat er niet in zit, ontbreekt geruisloos in
 * het rapport -- daar is achteraf niets aan te zien. Dat maakt de keuze belangrijk genoeg
 * om vast te leggen in stappen in plaats van hem elke keer opnieuw te bedenken.
 *
 * De valkuilen die dit script probeert af te vangen, komen uit de eerste keer dat het met
 * de hand ging (bo.zoetermeer.nl, 3 september 2026):
 *
 * 1. De planning stond vol met wat de klant had aangedragen -- twee PDF's op een ANDER
 *    domein. Die stonden dus niet in de sitemap en waren zonder die stap gemist.
 * 2. Twee pagina's van hetzelfde sjabloon werden allebei gekozen, omdat de een meer
 *    PDF-links had dan de ander. Aantal is geen dekking: twee identieke gevallen leveren
 *    één bevinding op die je twee keer opschrijft.
 * 3. Een overzichtspagina met doorklikkers werd overgeslagen omdat de telling "twee
 *    lijsten" zag. Een lijst met doorklikkers is iets anders dan een lijst met links in
 *    lopende tekst -- het gaat om de rol, niet om het element.
 *
 * Vandaar dat fase 3 de agent naar de ROL van wat er staat laat kijken en niet naar
 * elementtellingen, en dat fase 4 expliciet op sjabloonherhaling toetst.
 */

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
  throw new Error(
    'args.projectId is verplicht. Roep aan met args: { projectId: "...", url: "https://..." }',
  )
}
const drooglopen = opts.drooglopen === true
const maxKandidaten = opts.maxKandidaten || 30

/** Adres zonder afsluitende slash, voor het samenstellen van /sitemap.xml. */
const zonderSlash = (u) => String(u).replace(/[/]+$/, '')

// ---------------------------------------------------------------------------
// FASE 1 — Planning lezen
//
// Eerst. Op bo.zoetermeer.nl stonden de twee PDF's die de klant had aangedragen op een
// CDN-domein; wie met de sitemap begint, vindt die nooit.
// ---------------------------------------------------------------------------
phase('Planning lezen')

const PLANNING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'startUrl',
    'onderzoekstype',
    'aangedragenPaginas',
    'buitenScope',
    'bestaandeSamples',
    'scopeInfo',
  ],
  properties: {
    startUrl: { type: 'string' },
    onderzoekstype: { type: 'string' },
    aangedragenPaginas: { type: 'array', items: { type: 'string' } },
    buitenScope: { type: 'array', items: { type: 'string' } },
    bestaandeSamples: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'url'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: ['string', 'null'] },
        },
      },
    },
    scopeInfo: { type: ['string', 'null'] },
  },
}

const planning = await agent(
  `Lees de planning van project ${projectId} in de Shift2 Auditor. Draai vanuit de projectmap:

  npm run cli -- get-project ${projectId}

Geef terug:
- startUrl: de te onderzoeken website. Kijk naar project.scopeInScope; staat daar een lijst, neem dan de eerste. ${
    opts.url
      ? `De aanroeper gaf "${opts.url}" mee -- gebruik die, tenzij de planning iets anders zegt.`
      : ''
  }
- onderzoekstype: project.researchType, letterlijk.
- aangedragenPaginas: elke URL uit project.sampleClientPages, één per regel gesplitst. DIT IS BELANGRIJK: de klant heeft deze pagina's zelf aangewezen en ze MOETEN in de steekproef. Ze staan vaak op een ander domein (documenten op een CDN) en zijn dan via de sitemap niet te vinden.
- buitenScope: URL's uit project.scopeOutOfScope, één per regel.
- bestaandeSamples: wat er al in de steekproef staat (project.sampleItems), zodat we niets dubbel aanmaken.
- scopeInfo: project.scopeInfo, de tekst met wat buiten het onderzoek valt.

Verzin niets. Is een veld leeg, geef dan een lege lijst of null.`,
  { label: 'planning', phase: 'Planning lezen', schema: PLANNING_SCHEMA },
)

if (!planning || !planning.startUrl) {
  return {
    error: 'Geen startUrl gevonden. Staat er een website in de scope van dit project?',
    planning,
  }
}

log(`${planning.onderzoekstype} op ${planning.startUrl}`)
if (planning.aangedragenPaginas.length) {
  log(`De klant heeft ${planning.aangedragenPaginas.length} pagina's aangedragen; die gaan sowieso mee.`)
}
if (planning.bestaandeSamples.length) {
  log(`Let op: er staan al ${planning.bestaandeSamples.length} samples in de steekproef.`)
}

// ---------------------------------------------------------------------------
// FASE 2 — Kandidaten zoeken
// ---------------------------------------------------------------------------
phase('Kandidaten zoeken')

const KANDIDATEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['bron', 'urls', 'toelichting'],
  properties: {
    bron: { type: 'string' },
    urls: { type: 'array', items: { type: 'string' } },
    toelichting: { type: 'string' },
  },
}

const kandidaten = await agent(
  `Zoek de pagina's van ${planning.startUrl}, zodat we er straks een steekproef uit kunnen kiezen.

Probeer in deze volgorde:

1. **De sitemap.** Haal ${zonderSlash(planning.startUrl)}/sitemap.xml op met curl en lees de loc-regels. Levert dat een index op (een sitemap die naar andere sitemaps verwijst), haal die dan ook op. Probeer bij een 404 ook /sitemap_index.xml.
2. **robots.txt.** Daar staat vaak een Sitemap-regel met een afwijkend pad.
3. **De crawler.** Lukt geen van beide, gebruik dan \`npm run cli -- get-html\` op de startpagina en verzamel de interne links uit de HTML. Ga één niveau dieper op de gevonden overzichtspagina's.

Regels:
- Alleen pagina's op hetzelfde domein als ${planning.startUrl}, plus alles wat in deze lijst staat (aangedragen door de klant, mag een ander domein zijn): ${JSON.stringify(planning.aangedragenPaginas)}
- Gooi weg wat overduidelijk dubbel is: /home naast /, of dezelfde pagina met een andere query.
- Neem PDF-links WEL mee. De crawler van dit project sluit ze uit, maar we hebben er twee nodig.
- Deze URL's vallen buiten scope, laat ze liggen: ${JSON.stringify(planning.buitenScope)}
- Zijn het er meer dan ${maxKandidaten * 3}, geef dan een gespreide selectie van ${maxKandidaten * 3}: uit elk pad-segment (/nieuws/, /contact, /producten/) een paar, zodat de spreiding blijft.

Geef terug:
- bron: 'sitemap', 'robots', of 'crawler' -- welke werkte.
- urls: de gevonden adressen.
- toelichting: één of twee zinnen. Hoeveel er waren, of de sitemap er was, en of je hebt moeten selecteren. Als je hebt geselecteerd, zeg dan hoeveel je hebt laten liggen -- een stille beperking leest als volledige dekking.`,
  { label: 'kandidaten', phase: 'Kandidaten zoeken', schema: KANDIDATEN_SCHEMA },
)

if (!kandidaten || !kandidaten.urls.length) {
  return {
    error: "Geen pagina's gevonden op deze site.",
    startUrl: planning.startUrl,
    toelichting: kandidaten ? kandidaten.toelichting : null,
  }
}

log(`${kandidaten.urls.length} kandidaten via ${kandidaten.bron}. ${kandidaten.toelichting}`)

// De aangedragen pagina's voorop: die gaan sowieso mee, dus die moeten sowieso bekeken.
const teBekijken = [
  ...planning.aangedragenPaginas,
  ...kandidaten.urls.filter((u) => !planning.aangedragenPaginas.includes(u)),
].slice(0, maxKandidaten)

const totaalBeschikbaar = new Set([...planning.aangedragenPaginas, ...kandidaten.urls]).size
if (totaalBeschikbaar > teBekijken.length) {
  log(
    `Ik bekijk er ${teBekijken.length} van de ${totaalBeschikbaar}. De rest blijft ongezien; verhoog args.maxKandidaten als dat te weinig is.`,
  )
}

// ---------------------------------------------------------------------------
// FASE 3 — Pagina's bekijken
//
// Eén agent per pagina. Die kijkt naar de ROL van wat er staat, niet naar het aantal
// elementen: drie ul-lijsten op een homepage en drie op een overzichtspagina zijn niet
// hetzelfde ding. Precies die verwarring liet op bo.zoetermeer.nl een overzichtspagina
// buiten de steekproef vallen.
// ---------------------------------------------------------------------------
phase("Pagina's bekijken")

const PAGINA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['url', 'titel', 'soort', 'gebieden', 'sjabloon', 'gehydrateerd', 'opmerking'],
  properties: {
    url: { type: 'string' },
    titel: { type: 'string' },
    soort: { type: 'string' },
    gebieden: { type: 'array', items: { type: 'string' } },
    sjabloon: { type: 'string' },
    gehydrateerd: { type: 'boolean' },
    opmerking: { type: ['string', 'null'] },
  },
}

const GEBIEDEN_UITLEG = `De dekkingslijst staat in wcag-regels/Shift2_Dekkingslijst_Steekproef.md. Lees dat bestand eerst; het is de enige bron. Groep 1 (koppen, links, tekstcontrast, focus) staat op elke pagina en telt NIET mee -- noem die niet. Groep 2 is wat je zoekt.

Kijk naar de ROL van wat er staat, niet naar het aantal HTML-elementen:
- Een lijst met doorklikkers naar andere pagina's is een OVERZICHT. Een lijst met links in lopende tekst is dat niet.
- Een afbeelding bovenaan die de pagina inleidt is een HERO. Een foto tussen de tekst is dat niet.
- Tekst IN een afbeelding gebrand is iets anders dan tekst OVER een afbeelding heen: het eerste valt onder 1.4.5, het tweede onder 1.4.3.

NOEM ALLEEN WAT JE KUNT AANWIJZEN. Voor elk gebied dat je opgeeft, moet er iets in de opgehaalde pagina staan dat je kunt citeren: een element, een stuk tekst, een bestandsnaam. Twijfel je, noem het dan NIET -- "er staat geen tabel op" is informatie, een gebied verzinnen omdat het er zou kunnen staan, is dat niet.

Twee vergissingen die eerder zijn gemaakt:
- Een documentenlijst KREEG het gebied "afbeelding in een link" toebedeeld omdat een klassenaam \`listDocumentLink\` heette. Er stond geen enkele img of svg op die pagina. Een klassenaam is geen waarneming.
- Een voorleesknop werd aangezien voor iets dat meetelt. "Lees voor", "Eenvoudige tekst" en de hoogcontrastknop staan op élke pagina van een sitesjabloon; die horen in groep 1 en zijn nooit een reden om een pagina te kiezen.`

const paginas = (
  await parallel(
    teBekijken.map((url, i) => () =>
      agent(
        `Bekijk deze pagina en stel vast welke soorten inhoud erop staan: ${url}

Haal hem op met:

  npm run cli -- get-html ${url} --text

Is het een PDF (het adres eindigt op .pdf), dan hoef je hem niet op te halen: geef soort "pdf" en leid uit de bestandsnaam en het adres af wat voor document het is (besluit, nota, formulier, folder, verslag).

${GEBIEDEN_UITLEG}

Geef terug:
- url: het adres dat je kreeg.
- titel: de title zonder de sitenaam erachter, of bij een PDF een leesbare naam uit het bestandspad.
- soort: waar deze pagina voor dient, in twee of drie woorden. Bijvoorbeeld: homepage, overzichtspagina, bekendmaking, nieuwsbericht, contactpagina, formulierstap, informatiepagina, pdf-besluit, pdf-nota.
- gebieden: de gebieden uit groep 2 die je hebt gezien, met hun naam uit het regelbestand.
- sjabloon: een korte vingerafdruk van de opbouw, zodat we straks kunnen zien of twee pagina's op hetzelfde sjabloon draaien. Bijvoorbeeld "kruimelpad + kop + lijst met documentlinks" of "hero + intro + kaartjes in twee kolommen". Beschrijf de STRUCTUUR, niet de inhoud.
- gehydrateerd: het veld \`gehydrateerd\` uit de uitvoer van get-html. Staat dat op false, dan is er iets mis met de pagina en zijn je waarnemingen onbetrouwbaar -- zeg dat dan in de opmerking.
- opmerking: alleen als er iets is dat de onderzoeker moet weten. Een cookiemuur, een pagina die niet laadde, een uitklapblok dat je niet open kreeg. Anders null.`,
        { label: `bekijk:${i + 1}`, phase: "Pagina's bekijken", schema: PAGINA_SCHEMA },
      ),
    ),
  )
).filter(Boolean)

if (!paginas.length) {
  return { error: 'Geen enkele pagina kon bekeken worden.', kandidaten: teBekijken.length }
}

const nietGehydrateerd = paginas.filter((p) => !p.gehydrateerd)
if (nietGehydrateerd.length) {
  log(
    `LET OP: ${nietGehydrateerd.length} pagina's laadden hun JavaScript niet. Daar kloppen de waarnemingen mogelijk niet.`,
  )
}
log(`${paginas.length} pagina's bekeken.`)

// ---------------------------------------------------------------------------
// FASE 4 — Steekproef kiezen
//
// Barrière, en terecht: de keuze gaat over de verzameling als geheel. Welke pagina de
// meeste nog-ongedekte gebieden toevoegt, is pas te bepalen als alle pagina's naast
// elkaar liggen -- en of twee pagina's op hetzelfde sjabloon draaien al helemaal.
// ---------------------------------------------------------------------------
phase('Steekproef kiezen')

const KEUZE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['samples', 'nietGedekt', 'afgevallen', 'toelichting'],
  properties: {
    samples: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'titel', 'type', 'gebieden', 'waarom'],
        properties: {
          url: { type: 'string' },
          titel: { type: 'string' },
          type: { type: 'string', enum: ['structured', 'random', 'pdf'] },
          gebieden: { type: 'array', items: { type: 'string' } },
          waarom: { type: 'string' },
        },
      },
    },
    nietGedekt: { type: 'array', items: { type: 'string' } },
    afgevallen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'reden'],
        properties: { url: { type: 'string' }, reden: { type: 'string' } },
      },
    },
    toelichting: { type: 'string' },
  },
}

const keuze = await agent(
  `Kies uit deze bekeken pagina's de kortste steekproef die alle aanwezige gebieden dekt.

DE PAGINA'S:
${JSON.stringify(paginas, null, 1)}

DOOR DE KLANT AANGEDRAGEN (moeten er sowieso in):
${JSON.stringify(planning.aangedragenPaginas)}

STAAT AL IN DE STEEKPROEF (niet nog eens aanmaken):
${JSON.stringify(planning.bestaandeSamples.map((s) => s.url).filter(Boolean))}

Lees eerst wcag-regels/Shift2_Dekkingslijst_Steekproef.md en wcag-checklists/Stappenplan_Shift2_Audit.md (stap 4).

HOE JE KIEST:

1. De homepage gaat er altijd in.
2. De door de klant aangedragen pagina's gaan er altijd in.
3. Kies daarna steeds de pagina die de MEESTE nog-ongedekte gebieden toevoegt. Herhaal tot elk gebied dat op deze site voorkomt, minstens één keer in de steekproef zit.
4. Stop dan. Een pagina die niets nieuws dekt, hoort er niet in.

TWEE HARDE EISEN uit de dekkingslijst:
- Precies 2 video's, onderling verschillend (andere speler of andere ondertitelsituatie). Staan er twee op één pagina, dan is die ene pagina genoeg.
- Precies 2 PDF's, verschillend van SOORT: een formulier tegenover een nota, een besluit tegenover een folder. Heeft de site er minder, zeg dat dan.

WAAR HET DE VORIGE KEER MISGING -- let hier op:
- **Aantal is geen dekking.** Een pagina met 24 documentlinks dekt niet meer dan een pagina met 12, als het hetzelfde soort links zijn. Twee identieke gevallen leveren één bevinding op die je twee keer opschrijft.
- **Hetzelfde sjabloon = hetzelfde geval.** Kijk naar het veld \`sjabloon\`. Draaien twee pagina's op dezelfde opbouw en hebben ze dezelfde soort, neem er dan één. Kies de rijkste, niet de grootste.
- **Een overzicht met doorklikkers is een eigen gebied.** Ook zonder afbeeldingen: kaartjes met een titel en een datum vallen onder "teaser- of kaartafbeeldingen in een overzicht", en juist daar speelt de vraag of de datum in de code bij het goede item hoort.

DE RANDOM-TREKKING:
Minstens 10% van de steekproef moet type 'random' zijn: een pagina die je NIET hebt gekozen omdat hij iets bepaalds bevat, maar willekeurig. Kies er daarom één of twee die inhoudelijk niets nieuws toevoegen -- juist dat is de bedoeling. Bij 6 samples is 1 random genoeg.

DE TYPES:
- 'pdf' voor een .pdf-adres.
- 'random' voor de willekeurige trekking.
- 'structured' voor de rest.

Geef terug:
- samples: de gekozen pagina's, in de volgorde waarin ze in de steekproef moeten staan: homepage bovenaan, dan de overige structured met de random ertussen, formulierstappen op stapvolgorde, PDF's onderaan.
- nietGedekt: de gebieden uit groep 2 die op deze site NERGENS voorkomen. Dit is een uitkomst over de site en hoort in het voorstel te staan -- "geen video's, geen tabellen, geen formulieren" is informatie, geen tekort.
- afgevallen: pagina's die je hebt bekeken maar niet gekozen, met de reden. Wees kort: "zelfde sjabloon als X", "dekt niets nieuws".
- toelichting: twee of drie zinnen over de site en de steekproef.`,
  { label: 'kiezen', phase: 'Steekproef kiezen', schema: KEUZE_SCHEMA },
)

if (!keuze || !keuze.samples.length) {
  return {
    error: 'Er kon geen steekproef samengesteld worden.',
    paginas: paginas.length,
    toelichting: keuze ? keuze.toelichting : null,
  }
}

const aantalRandom = keuze.samples.filter((s) => s.type === 'random').length
const percentageRandom = Math.round((aantalRandom / keuze.samples.length) * 100)
log(
  `${keuze.samples.length} samples gekozen, ${aantalRandom} random (${percentageRandom}%). ${keuze.toelichting}`,
)
if (keuze.nietGedekt.length) {
  log(`Niet op deze site: ${keuze.nietGedekt.join(', ')}.`)
}

if (drooglopen) {
  return {
    drooglopen: true,
    startUrl: planning.startUrl,
    bron: kandidaten.bron,
    bekeken: paginas.length,
    voorstel: keuze.samples,
    nietGedekt: keuze.nietGedekt,
    afgevallen: keuze.afgevallen,
    randomPercentage: percentageRandom,
    toelichting: keuze.toelichting,
  }
}

// ---------------------------------------------------------------------------
// FASE 5 — Wegschrijven
//
// De volgorde ligt vast in het stappenplan: homepage bovenaan, structured met random
// ertussen, formulierstappen op volgorde, PDF's onderaan. De keuze-agent heeft ze al in
// die volgorde teruggegeven; de POST-route zet zelf het volgnummer.
// ---------------------------------------------------------------------------
phase('Wegschrijven')

const SCHRIJF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['aangemaakt', 'mislukt'],
  properties: {
    aangemaakt: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'titel'],
        properties: { id: { type: 'string' }, titel: { type: 'string' } },
      },
    },
    mislukt: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'fout'],
        properties: { url: { type: 'string' }, fout: { type: 'string' } },
      },
    },
  },
}

const uitkomst = await agent(
  `Maak deze samples aan in project ${projectId}, in precies deze volgorde:

${JSON.stringify(keuze.samples, null, 1)}

Per sample:

  npm run cli -- create-sample-item ${projectId} --title="<titel>" --url="<url>" --type=<type> --voorgesteld=true --description="<gebieden, komma-gescheiden>"

Let op:
- **--voorgesteld=true is verplicht.** Zonder die vlag komt de steekproef er als goedgekeurd in, en dan draait audit-samples straks op pagina's die de onderzoeker niet heeft gezien.
- De beschrijving is een KALE OPSOMMING van de contenttypen, geen zin. Dus: "overzicht met doorklikkers, twee kopniveaus" en niet "Deze pagina is gekozen omdat er een overzicht op staat". Die opsomming wordt door de auditagent meegelezen; een verantwoording van jouw keuze zou hem sturen.
- Is de pagina door de klant aangedragen, zet dat er dan voor: "Door klant aangedragen. <gebieden>".
- Maak ze aan in de volgorde waarin ze hierboven staan. De route zet zelf het volgnummer, dus de volgorde van aanmaken IS de volgorde in de steekproef.
- Ga door als er één mislukt; noteer hem.

Geef terug welke id's je hebt aangemaakt, en wat er misging.`,
  { label: 'wegschrijven', phase: 'Wegschrijven', schema: SCHRIJF_SCHEMA },
)

return {
  startUrl: planning.startUrl,
  onderzoekstype: planning.onderzoekstype,
  bron: kandidaten.bron,
  kandidatenGevonden: kandidaten.urls.length,
  paginasBekeken: paginas.length,
  paginasNietGehydrateerd: nietGehydrateerd.map((p) => p.url),
  samplesAangemaakt: uitkomst && uitkomst.aangemaakt ? uitkomst.aangemaakt.length : 0,
  mislukt: uitkomst && uitkomst.mislukt ? uitkomst.mislukt : [],
  randomPercentage: percentageRandom,
  // Wat de site niet heeft. Hoort in het voorstel: "geen video's gevonden" is informatie.
  nietGedekt: keuze.nietGedekt,
  afgevallen: keuze.afgevallen,
  toelichting: keuze.toelichting,
  volgendeStap: `Loop de steekproef na op /admin/projects/${projectId}?tab=steekproef en klik per pagina op Akkoord. audit-samples weigert te starten zolang er voorstellen openstaan.`,
}
