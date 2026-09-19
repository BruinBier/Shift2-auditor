"""De leesvolgorde van een PDF: wat hulpsoftware achter elkaar doorloopt.

Voor een HTML-pagina doet `get-leesvolgorde` dit door de CSS-positie naast de
code-volgorde te leggen. Een PDF heeft geen CSS en geen DOM, dus dat commando
kan hier niet draaien -- en 1.3.2 bleef daardoor op "niet gemeten" staan,
terwijl de vraag hier net zo goed te beantwoorden is. Alleen uit een andere
bron: de tagboom. Die IS de leesvolgorde; hulpsoftware loopt hem van voor naar
achter af, ongeacht waar de tekst op de pagina staat.

WAT HET MEET
  De boom wordt in leesvolgorde afgelopen en van elk element wordt de pagina
  genoteerd. Springt de volgorde terug -- element op pagina 36 gevolgd door een
  element op pagina 32 -- dan leest hulpsoftware iets voor dat visueel vier
  pagina's eerder staat.

WAAROM HET GROEPEERT
  Het ruwe aantal terugsprongen is misleidend. Op Bijlage 2 van ZOET-01 zijn 78
  losse sprongen samen 10 verschijnselen: een lijst die over een paginagrens
  doorloopt levert er tientallen op die allemaal hetzelfde ene ding zijn. Wie op
  78 afgaat, keurt af op ruis; wie de blokken bekijkt, ziet dat er twee zijn die
  drie tot vier pagina's terugspringen en acht die één pagina teruggaan.

WAT HET NIET DOET
  Oordelen. Een terugsprong van één pagina is bijna altijd een lijst of een
  alinea die over de paginagrens loopt, met /Pg naar de eindpagina -- normaal
  gedrag. Een sprong van drie of meer is dat zelden. Waar de grens ligt en of
  het verplaatste element betekenis draagt, weegt de onderzoeker; het commando
  zet de blokken op een rij met hun afstand en hun omvang.

Aanroepen:  python scripts/pdf-leesvolgorde.py <bestand.pdf>
"""
import json
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError as e:  # pragma: no cover
    print(json.dumps({'fout': 'ontbrekende module: %s' % e}))
    raise SystemExit(1)

# Vanaf hoeveel pagina's terug is een sprong het melden waard? Eén pagina terug
# is vrijwel altijd een blok dat over de paginagrens loopt.
OPVALLEND_VANAF = 2


def meet(pad):
    doc = fitz.open(pad)

    def obj(x):
        return doc.xref_object(x, compressed=False)

    def kids(x):
        s = obj(x)
        m = re.search(r'/K\s*(.+?)(?=/[A-Z]|>>\s*$)', s, re.S)
        return [int(r) for r in re.findall(r'(\d+)\s+0\s+R', m.group(1))] if m else []

    def soort(x):
        m = re.search(r'/S\s*/([A-Za-z0-9#]+)', obj(x))
        return m.group(1) if m else None

    paginaVan = {}
    for i in range(doc.page_count):
        paginaVan[doc[i].xref] = i + 1

    def pagina(x, d=0):
        m = re.search(r'/Pg\s+(\d+)\s+0\s+R', obj(x))
        if m:
            return paginaVan.get(int(m.group(1)))
        if d > 10:
            return None
        for k in kids(x):
            r = pagina(k, d + 1)
            if r:
                return r
        return None

    cat = obj(doc.pdf_catalog())
    m = re.search(r'/StructTreeRoot\s+(\d+)\s+0\s+R', cat)
    if not m:
        return {
            'bestand': pad,
            'paginas': doc.page_count,
            'tagboom': False,
            'toelichting': (
                'Geen tagstructuur: er is geen vastgelegde leesvolgorde. Hulpsoftware valt '
                'terug op de volgorde waarin de tekst in het bestand staat, en die is niet '
                'te controleren. Dat is een 1.3.1-kwestie; 1.3.2 is hier niet vast te '
                'stellen.'
            ),
        }

    volgorde, gezien = [], set()

    def loop(x, d=0):
        if x in gezien or d > 60:
            return
        gezien.add(x)
        p, t = pagina(x), soort(x)
        if p and t:
            volgorde.append((p, t))
        for k in kids(x):
            loop(k, d + 1)

    loop(int(m.group(1)))

    # Groepeer opeenvolgende sprongen van dezelfde herkomst naar dezelfde pagina.
    blokken, vorige, huidig = [], 0, None
    for p, t in volgorde:
        if p < vorige:
            if huidig and huidig['naarPagina'] == p and huidig['vanPagina'] == vorige:
                huidig['elementen'] += 1
            else:
                huidig = {
                    'vanPagina': vorige,
                    'naarPagina': p,
                    'paginasTerug': vorige - p,
                    'elementen': 1,
                    'eersteType': t,
                }
                blokken.append(huidig)
        else:
            huidig = None
        vorige = max(vorige, p)

    opvallend = [b for b in blokken if b['paginasTerug'] >= OPVALLEND_VANAF]
    getagd = [i + 1 for i in range(doc.page_count)
              if '/StructParents' in doc.xref_object(doc[i].xref, compressed=False)]

    return {
        'bestand': pad,
        'paginas': doc.page_count,
        'tagboom': True,
        'paginasGetagd': len(getagd),
        'elementenInLeesvolgorde': len(volgorde),
        'terugsprongen': sum(b['elementen'] for b in blokken),
        'blokken': len(blokken),
        'opvallend': sorted(opvallend, key=lambda b: -b['paginasTerug']),
        'eenPaginaTerug': len(blokken) - len(opvallend),
        'let_op': [
            'Het aantal losse terugsprongen zegt weinig: een lijst over een paginagrens '
            'levert er tientallen op die samen een verschijnsel zijn. Kijk naar de blokken.',
            'Een blok van een pagina terug is vrijwel altijd een alinea of lijst die over de '
            'paginagrens loopt, met /Pg naar de eindpagina. Normaal gedrag.',
            'Vanaf twee of drie paginas terug is het het bekijken waard. Weeg of het '
            'verplaatste element betekenis draagt: een figuur met een leeg tekstalternatief '
            'wordt niet voorgelezen en verandert de betekenisvolle volgorde niet.',
            'Dit meet de vastgelegde leesvolgorde. Of de inhoud daarmee begrijpelijk blijft, '
            'leest de onderzoeker in de schermlezer-voorvertoning van PAC.',
        ],
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'fout': 'gebruik: pdf-leesvolgorde.py <bestand.pdf>'}))
        raise SystemExit(1)
    try:
        print(json.dumps(meet(sys.argv[1]), ensure_ascii=False, indent=1))
    except Exception as e:
        print(json.dumps({'fout': str(e)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
