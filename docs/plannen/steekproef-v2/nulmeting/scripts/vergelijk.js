// Gebruik: node vergelijk.js <map> <kenmerk> [<kenmerk> ...]  -> markdown op stdout
const fs = require('fs')
const path = require('path')
const [map, ...kenmerken] = process.argv.slice(2)

// Gebieden uit groep 2 van de dekkingslijst; de agents formuleren de naam telkens net anders.
const GEBIEDEN = [
  [1, 'Logo', /^logo/i],
  [3, 'Hero met tekst erin gebrand', /hero.*(erin|gebrand)/i],
  [4, 'Hero met tekst eroverheen', /hero.*eroverheen/i],
  [2, 'Hero zonder tekst', /hero/i],
  [5, 'Teaser-/kaartafbeeldingen in overzicht', /teaser|kaartafbeelding|kaartjes/i],
  [6, 'Afbeelding in link of knop', /afbeelding in een (link|knop)|afbeelding in link/i],
  [7, 'Iconen zonder tekst', /icoon|iconen|pictogram/i],
  [8, 'Complex beeld', /complex beeld|schema|organogram|infographic/i],
  [9, 'Kaart/plattegrond als afbeelding', /plattegrond|kaart .*als afbeelding/i],
  [10, 'Afbeelding met onderschrift/figure', /onderschrift|figure/i],
  [11, 'Foto in lopende tekst', /foto in de lopende/i],
  [12, 'Fotogalerij', /galerij/i],
  [13, 'Poster/aankondiging', /poster|aankondiging/i],
  [15, 'Grafiek/diagram met legenda', /grafiek|diagram/i],
  [14, 'Afbeelding met tekst erin', /afbeelding met tekst erin/i],
  [16, 'Tabel', /^tabel/i],
  [17, 'Lijst/geneste lijst', /lijst/i],
  [18, 'Citaat', /citaat/i],
  [19, 'Anderstalig fragment', /anderstalig tekstfragment|anderstalig fragment/i],
  [20, 'Anderstalige pagina', /anderstalige pagina/i],
  [21, 'Video met geluid', /video met geluid/i],
  [22, 'Video zonder geluid/GIF', /video zonder geluid|gif/i],
  [23, 'Audio/podcast', /audio|podcast/i],
  [24, 'Live uitzending', /live/i],
  [25, 'Accordeon/tabbladen', /accordeon|tabblad|uitklap/i],
  [32, 'Invulbaar PDF-formulier', /invulbaar/i],
  [26, 'Formulier', /formulier/i],
  [27, 'Beweegt uit zichzelf', /beweegt|slider|carrousel/i],
  [28, 'Eigen sjabloon', /eigen sjabloon|portaal|boekingsmodule/i],
  [29, 'Kaart in iframe', /kaart in een iframe|kaart in iframe/i],
  [30, 'Ander kader ander domein', /ander kader|ander domein/i],
  [31, 'PDF', /pdf/i],
]
const naarNr = (s) => {
  for (const [nr, , re] of GEBIEDEN) if (re.test(s)) return nr
  return null
}
const naam = (nr) => (GEBIEDEN.find((g) => g[0] === nr) || [, '?'])[1]
const nrs = (lijst) => new Set((lijst || []).map(naarNr).filter((x) => x != null))

// cb=... achter een CDN-adres is een cachebreker, geen ander document.
const norm = (u) => {
  try {
    const x = new URL(u)
    x.searchParams.delete('cb')
    x.hash = ''
    let p = x.pathname.replace(/\/+$/, '') || '/'
    return (x.host.replace(/^www\./, '') + p + (x.search || '')).toLowerCase()
  } catch {
    return String(u).toLowerCase()
  }
}
const kort = (u) => decodeURIComponent(norm(u)).replace(/^[^/]+/, '').slice(0, 70) || '/'
const verschil = (a, b) => [...a].filter((x) => !b.has(x))
const lees = (f) => JSON.parse(fs.readFileSync(path.join(map, f), 'utf8'))

const uit = []
const p = (s = '') => uit.push(s)

for (const k of kenmerken) {
  const r = [1, 2].map((n) => lees(`${k}-v1-run${n}.json`))
  const ref = fs.existsSync(path.join(map, `${k}-referentie-bestaande-steekproef.json`))
    ? lees(`${k}-referentie-bestaande-steekproef.json`)
    : null
  p(`## ${k}`)
  p()
  p('| | Run 1 | Run 2 |')
  p('|---|---|---|')
  p(`| Bron kandidaten | ${r[0].kandidaten.bron} | ${r[1].kandidaten.bron} |`)
  p(`| Kandidaten gevonden | ${r[0].kandidaten.urls.length} | ${r[1].kandidaten.urls.length} |`)
  p(`| Pagina's bekeken | ${r[0].paginasBekeken.length} | ${r[1].paginasBekeken.length} |`)
  const isPdf = (u) => /\.pdf(\?|$)/i.test(u)
  p(`| Waarvan PDF | ${r[0].paginasBekeken.filter((x) => isPdf(x.url)).length} | ${r[1].paginasBekeken.filter((x) => isPdf(x.url)).length} |`)
  p(`| HTML niet gehydrateerd | ${r[0].paginasBekeken.filter((x) => !isPdf(x.url) && !x.gehydrateerd).length} | ${r[1].paginasBekeken.filter((x) => !isPdf(x.url) && !x.gehydrateerd).length} |`)
  p(`| Samples gekozen | ${r[0].keuze.samples.length} | ${r[1].keuze.samples.length} |`)
  p(`| Waarvan random | ${r[0].keuze.samples.filter((s) => s.type === 'random').length} | ${r[1].keuze.samples.filter((s) => s.type === 'random').length} |`)
  p(`| Agents / tokens | ${r[0].gebruik.agents} / ${Math.round(r[0].gebruik.tokens / 1000)}k | ${r[1].gebruik.agents} / ${Math.round(r[1].gebruik.tokens / 1000)}k |`)
  p()

  const kand = r.map((x) => new Set(x.kandidaten.urls.map(norm)))
  const bek = r.map((x) => new Set(x.paginasBekeken.map((q) => norm(q.url))))
  p(`**Kandidaten:** ${[...kand[0]].filter((x) => kand[1].has(x)).length} in beide runs, ${verschil(kand[0], kand[1]).length} alleen in run 1, ${verschil(kand[1], kand[0]).length} alleen in run 2.`)
  p(`**Bekeken:** ${[...bek[0]].filter((x) => bek[1].has(x)).length} in beide runs, ${verschil(bek[0], bek[1]).length} alleen in run 1, ${verschil(bek[1], bek[0]).length} alleen in run 2.`)
  p()

  const gek = r.map((x) => new Map(x.keuze.samples.map((s) => [norm(s.url), s])))
  const refSet = ref ? new Set(ref.samples.map((s) => norm(s.url))) : new Set()
  const alle = [...new Set([...gek[0].keys(), ...gek[1].keys(), ...refSet])]
  p('**Gekozen pagina\'s** (s = structured, r = random, p = pdf, - = niet gekozen)')
  p()
  p(`| Pagina | Run 1 | Run 2 |${ref ? ' Bestaande steekproef |' : ''}`)
  p(`|---|---|---|${ref ? '---|' : ''}`)
  const t = (s) => (s ? s.type[0] : '-')
  for (const u of alle.sort()) {
    const refItem = ref && ref.samples.find((s) => norm(s.url) === u)
    p(`| ${kort(u)} | ${t(gek[0].get(u))} | ${t(gek[1].get(u))} |${ref ? ` ${refItem ? refItem.type[0] : '-'} |` : ''}`)
  }
  const beide = [...gek[0].keys()].filter((u) => gek[1].has(u)).length
  const unie = new Set([...gek[0].keys(), ...gek[1].keys()]).size
  p()
  p(`Overlap gekozen: ${beide} van ${unie} (Jaccard ${(beide / unie).toFixed(2)}).`)
  const rnd = r.map((x) => x.keuze.samples.filter((s) => s.type === 'random').map((s) => kort(s.url)))
  p(`Random-pagina: run 1 ${rnd[0].join(', ') || '-'}; run 2 ${rnd[1].join(', ') || '-'}.`)
  p()

  const ged = r.map((x) => {
    const s = new Set()
    for (const q of x.keuze.samples) for (const n of nrs(q.gebieden)) s.add(n)
    return s
  })
  const nietGed = r.map((x) => nrs(x.keuze.nietGedekt))
  p('**Gebieden** (dekkingslijst groep 2)')
  p()
  p(`- Gedekt in run 1: ${ged[0].size}; in run 2: ${ged[1].size}.`)
  const g1 = verschil(ged[0], ged[1]).sort((a, b) => a - b)
  const g2 = verschil(ged[1], ged[0]).sort((a, b) => a - b)
  p(`- Alleen gedekt in run 1: ${g1.map((n) => `${n} ${naam(n)}`).join('; ') || 'geen'}.`)
  p(`- Alleen gedekt in run 2: ${g2.map((n) => `${n} ${naam(n)}`).join('; ') || 'geen'}.`)
  // Tegenspraak: een gebied dat de ene run gedekt noemt en de andere "niet op de site".
  const tegen = [...verschil(ged[0], ged[1])].filter((n) => nietGed[1].has(n)).concat(
    [...verschil(ged[1], ged[0])].filter((n) => nietGed[0].has(n)),
  )
  p(`- Tegenspraak (de ene run dekt het, de andere zegt dat het niet op de site staat): ${[...new Set(tegen)].sort((a, b) => a - b).map((n) => `${n} ${naam(n)}`).join('; ') || 'geen'}.`)
  p()

  // Hoe stabiel zijn de etiketten op dezelfde pagina?
  const perPag = r.map((x) => new Map(x.paginasBekeken.map((q) => [norm(q.url), q])))
  const gedeeld = [...perPag[0].keys()].filter((u) => perPag[1].has(u))
  let gelijk = 0
  const afwijk = []
  for (const u of gedeeld) {
    const a = nrs(perPag[0].get(u).gebieden)
    const b = nrs(perPag[1].get(u).gebieden)
    const zelfde = a.size === b.size && [...a].every((x) => b.has(x))
    if (zelfde) gelijk++
    else afwijk.push({ u, alleen1: verschil(a, b), alleen2: verschil(b, a) })
  }
  p(`**Etiketten per pagina:** van de ${gedeeld.length} pagina's die beide runs bekeken, kregen er ${gelijk} in beide runs dezelfde gebieden; ${afwijk.length} verschillen.`)
  if (afwijk.length) {
    p()
    p('| Pagina | Alleen run 1 | Alleen run 2 |')
    p('|---|---|---|')
    for (const a of afwijk)
      p(`| ${kort(a.u)} | ${a.alleen1.map(naam).join(', ') || '-'} | ${a.alleen2.map(naam).join(', ') || '-'} |`)
  }
  p()
  p('**Toelichting van de keuze-agent**')
  p()
  p(`- Run 1: ${r[0].keuze.toelichting}`)
  p(`- Run 2: ${r[1].keuze.toelichting}`)
  p()
}
process.stdout.write(uit.join('\n'))
