"""Consistente identificatie binnen één PDF-document (SC 3.2.4).

`get-consistentie` kan dit niet: dat haalt de sample-items van het project op en
legt de PAGINA'S VAN DE STEEKPROEF naast elkaar. Op een PDF-kaart bood het dus
een knop aan die een andere vraag beantwoordt -- die van de website.

Een PDF is een eigen set. De vraag is of hetzelfde onderdeel binnen dit document
overal hetzelfde wordt aangeduid. Wat daarvoor te vergelijken valt:

  1. Koppelingen met hetzelfde doel. Staat er twee keer een link naar dezelfde
     pagina met een andere tekst, dan is dat precies de 3.2.4-vraag.

  2. De opbouw van de koppen. Niet of een kop de lading dekt -- dat is 2.4.6 --
     maar of dezelfde soort kop consequent hetzelfde niveau krijgt.

LET OP: EEN LINK DIE OVER TWEE REGELS AFBREEKT
  De tekstextractie levert die als twee losse stukken op, met elk een eigen
  rechthoek. Zonder correctie lijkt er dan één doel met twee namen te zijn, en
  dat is de melding die je NIET wilt: op Bijlage 2 van ZOET-01 gebeurde het twee
  keer (pagina 38 en 39) en allebei waren het één link. Stukken van hetzelfde
  doel op dezelfde pagina die verticaal opeenvolgen, worden daarom samengevoegd.

Aanroepen:  python scripts/pdf-consistentie.py <bestand.pdf>
"""
import json
import re
import sys
from collections import defaultdict

try:
    import fitz  # PyMuPDF
except ImportError as e:  # pragma: no cover
    print(json.dumps({'fout': 'ontbrekende module: %s' % e}))
    raise SystemExit(1)

# Hoeveel punten mogen twee stukken van dezelfde link verticaal uit elkaar liggen
# en nog als doorloop gelden? Een regelhoogte is ruwweg 12-16 punten.
REGELAFSTAND = 30.0


def _links_per_doel(doc):
    """Alle koppelingen, met de afgebroken regels samengevoegd."""
    ruw = defaultdict(list)
    for i in range(doc.page_count):
        for l in doc[i].get_links():
            uri = l.get('uri')
            if not uri:
                continue
            r = l['from']
            tekst = ' '.join(doc[i].get_textbox(r).split())
            ruw[uri].append({'pagina': i + 1, 'tekst': tekst, 'y': r.y0, 'x': r.x0})

    per_doel = {}
    for uri, stukken in ruw.items():
        # Groepeer per pagina en voeg verticaal opeenvolgende stukken samen: dat is
        # één link die over meerdere regels loopt, geen tweede naam voor hetzelfde doel.
        namen = []
        for pagina in sorted({s['pagina'] for s in stukken}):
            opPagina = sorted(
                [s for s in stukken if s['pagina'] == pagina],
                key=lambda s: (s['y'], s['x']),
            )
            lopend = None
            for s in opPagina:
                if lopend is not None and abs(s['y'] - lopend['y']) <= REGELAFSTAND:
                    lopend['tekst'] = (lopend['tekst'] + ' ' + s['tekst']).strip()
                    lopend['y'] = s['y']
                    lopend['delen'] += 1
                else:
                    if lopend:
                        namen.append(lopend)
                    lopend = {'pagina': pagina, 'tekst': s['tekst'], 'y': s['y'], 'delen': 1}
            if lopend:
                namen.append(lopend)
        per_doel[uri] = namen
    return per_doel


def meet(pad):
    doc = fitz.open(pad)
    per_doel = _links_per_doel(doc)

    afwijkend = []
    for uri, namen in per_doel.items():
        unieke = {n['tekst'] for n in namen if n['tekst']}
        if len(unieke) > 1:
            afwijkend.append({
                'doel': uri,
                'namen': [
                    {'pagina': n['pagina'], 'tekst': n['tekst'],
                     'samengevoegdUit': n['delen']}
                    for n in namen
                ],
            })

    # Koppenopbouw: hoeveel per niveau, en of er niveaus worden overgeslagen.
    def obj(x):
        return doc.xref_object(x, compressed=False)

    def kids(x):
        s = obj(x)
        m = re.search(r'/K\s*(.+?)(?=/[A-Z]|>>\s*$)', s, re.S)
        return [int(r) for r in re.findall(r'(\d+)\s+0\s+R', m.group(1))] if m else []

    def soort(x):
        m = re.search(r'/S\s*/([A-Za-z0-9#]+)', obj(x))
        return m.group(1) if m else None

    niveaus = defaultdict(int)
    reeks = []
    cat = obj(doc.pdf_catalog())
    m = re.search(r'/StructTreeRoot\s+(\d+)\s+0\s+R', cat)
    if m:
        gezien = set()

        def loop(x, d=0):
            if x in gezien or d > 60:
                return
            gezien.add(x)
            t = soort(x)
            if t and re.match(r'^H[1-6]$', t):
                niveaus[t] += 1
                reeks.append(int(t[1]))
            for k in kids(x):
                loop(k, d + 1)

        loop(int(m.group(1)))

    sprongen = [
        {'van': reeks[i - 1], 'naar': reeks[i]}
        for i in range(1, len(reeks))
        if reeks[i] - reeks[i - 1] > 1
    ]

    return {
        'bestand': pad,
        'paginas': doc.page_count,
        'koppelingen': {
            'uniekeDoelen': len(per_doel),
            'doelenMetMeerDanEenNaam': len(afwijkend),
            'afwijkend': afwijkend,
        },
        'koppen': {
            'perNiveau': dict(sorted(niveaus.items())),
            'niveausOvergeslagen': len(sprongen),
            'sprongen': sprongen[:10],
        },
        'let_op': [
            'Dit vergelijkt BINNEN dit document. Een PDF is een eigen set; het oordeel van '
            'de website hoort hier niet.',
            'Stukken van dezelfde link die op een pagina verticaal opeenvolgen zijn '
            'samengevoegd: dat is een link die over twee regels afbreekt, geen tweede naam. '
            'Kijk bij "samengevoegdUit" hoeveel stukken het waren.',
            'Geen enkel doel met twee namen betekent dat er niets herhaald wordt dat anders '
            'wordt aangeduid. Dat is niet_aanwezig, een afgerond oordeel.',
            'Of een kop de lading dekt is 2.4.6, niet 3.2.4. Hier telt alleen of dezelfde '
            'soort kop consequent hetzelfde niveau krijgt.',
        ],
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'fout': 'gebruik: pdf-consistentie.py <bestand.pdf>'}))
        raise SystemExit(1)
    try:
        print(json.dumps(meet(sys.argv[1]), ensure_ascii=False, indent=1))
    except Exception as e:
        print(json.dumps({'fout': str(e)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
