"""Wat in een PDF exact vast te stellen is, in één keer uitgelezen.

Tien criteria stelden tot nu toe dezelfde vragen aan hetzelfde document, elk
apart en elk met de hand: staat er video in, is er een formulier, start er
geluid, is de taal vastgelegd. Een agent die dat tien keer doet, doet het tien
keer nét anders, en legt het nergens vast. Op ZOET-01 stonden daardoor dertien
criteria op "afweging van de agent" terwijl het antwoord hard uit het bestand
te lezen was.

Dit commando leest het één keer en geeft per vraag het bewijs terug.

WAT HIER WEL IN ZIT
  Vragen met een uitputtend antwoord. Een PDF kan maar op een handvol manieren
  geluid starten (/Sound, /Movie, /RichMedia, /Screen met /Rendition, of een
  script via /JS, /AA, /OpenAction). Zijn die er geen van alle, dan start er
  geen geluid. Dat is geen aanname over "dit soort documenten" maar een
  volledige zoekactie: de verzameling is eindig en helemaal af te lopen.
  Datzelfde geldt voor /AcroForm /Fields, /Lang en dc:title.

WAT HIER NIET IN ZIT
  Betekenisvragen. Of een tussenkopje een kop hád moeten zijn, of een
  linktekst het doel duidelijk maakt, of kleur de enige drager van informatie
  is -- dat leest niemand uit een bestand. Dit commando telt wat er staat en
  laat het oordeel aan de onderzoeker. Waar het de helft van een antwoord
  geeft, zegt het dat erbij ("hard" versus "telling").

Aanroepen:  python scripts/pdf-structuur.py <bestand.pdf> [--json]
"""
import json
import re
import sys

try:
    import fitz  # PyMuPDF
    import pikepdf
except ImportError as e:  # pragma: no cover
    print(json.dumps({'fout': 'ontbrekende module: %s' % e}))
    raise SystemExit(1)


# Alles waarmee een PDF geluid of bewegend beeld kan voortbrengen.
MEDIA_SLEUTELS = ['/Movie', '/Sound', '/RichMedia', '/Screen', '/Rendition', '/MediaClip']
# Alles waarmee een PDF uit zichzelf iets kan doen.
SCRIPT_SLEUTELS = ['/JS', '/JavaScript', '/AA', '/OpenAction', '/Launch']


def _tel_sleutels(ruw, sleutels):
    return {s: ruw.count(s.encode('latin-1')) for s in sleutels}


def _tagboom(doc):
    """Loop de tagboom af en tel de elementtypes plus de Figure-alts."""

    def obj(x):
        return doc.xref_object(x, compressed=False)

    def kids(x):
        s = obj(x)
        m = re.search(r'/K\s*(.+?)(?=/[A-Z]|>>\s*$)', s, re.S)
        return [int(r) for r in re.findall(r'(\d+)\s+0\s+R', m.group(1))] if m else []

    def soort(x):
        m = re.search(r'/S\s*/([A-Za-z0-9#]+)', obj(x))
        return m.group(1) if m else None

    cat = obj(doc.pdf_catalog())
    m = re.search(r'/StructTreeRoot\s+(\d+)\s+0\s+R', cat)
    if not m:
        return None

    types = {}
    figuren = {'met_alt': 0, 'zonder_alt': 0, 'lege_alt': 0}
    gezien = set()

    def loop(x, d=0):
        if x in gezien or d > 60:
            return
        gezien.add(x)
        t = soort(x)
        if t:
            types[t] = types.get(t, 0) + 1
        if t == 'Figure':
            s = obj(x)
            alt = re.search(r'/Alt\s*\((.*?)\)(?=\s*/|\s*>>)', s, re.S)
            if '/Alt' not in s:
                figuren['zonder_alt'] += 1
            elif alt and alt.group(1).strip() == '':
                figuren['lege_alt'] += 1
            else:
                figuren['met_alt'] += 1
        for k in kids(x):
            loop(k, d + 1)

    loop(int(m.group(1)))
    return {'types': types, 'figuren': figuren}


def meet(pad):
    doc = fitz.open(pad)
    pdf = pikepdf.open(pad)
    with open(pad, 'rb') as fh:
        ruw = fh.read()

    uit = {'bestand': pad, 'paginas': doc.page_count, 'vaststellingen': {}}
    vast = uit['vaststellingen']

    # --- media en scripts -------------------------------------------------
    media = _tel_sleutels(ruw, MEDIA_SLEUTELS)
    scripts = _tel_sleutels(ruw, SCRIPT_SLEUTELS)
    geen_media = sum(media.values()) == 0
    geen_scripts = sum(scripts.values()) == 0

    vast['media'] = {
        'hard': True,
        'sleutels': media,
        'aanwezig': not geen_media,
        'criteria': ['1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '2.1.4'],
        'gevolg': 'niet_aanwezig' if geen_media else 'aanwezig, beoordeel per video',
        'toelichting': (
            'Geen enkele media-sleutel in het bestand; een PDF kan alleen via deze '
            'sleutels video of geluid bevatten.' if geen_media
            else 'Er staat media in het document.'
        ),
    }

    vast['geluid_en_beweging'] = {
        'hard': True,
        'scriptsleutels': scripts,
        'startVanzelf': not (geen_media and geen_scripts),
        'criteria': ['1.4.2', '2.2.2', '2.3.1'],
        'gevolg': 'niet_aanwezig' if (geen_media and geen_scripts) else 'beoordeel handmatig',
        'toelichting': (
            'Geen media en geen scripts: er kan niets uit zichzelf beginnen. Voor 2.3.1 '
            'betekent dit dat er niets kan flitsen.' if (geen_media and geen_scripts)
            else 'Er is media of een script aanwezig; beoordeel wat er uit zichzelf start.'
        ),
    }

    # --- formuliervelden --------------------------------------------------
    acroform = pdf.Root.get('/AcroForm')
    velden = list(acroform.get('/Fields', [])) if acroform is not None else []
    vast['formuliervelden'] = {
        'hard': True,
        'acroform': acroform is not None,
        'aantal': len(velden),
        'criteria': ['1.3.5', '3.3.1', '3.3.2', '3.3.3', '3.3.7', '2.1.2', '2.5.3', '2.5.8'],
        'gevolg': 'niet_aanwezig' if not velden else 'beoordeel de velden',
        'toelichting': (
            'Geen invulbare velden. Zonder bedienbare elementen is er ook geen '
            'toetsenbordval, geen label-in-naam en geen aanwijsgebied.' if not velden
            else 'Het document heeft invulbare velden.'
        ),
    }

    # --- taal -------------------------------------------------------------
    lang = pdf.Root.get('/Lang')
    vast['taal'] = {
        'hard': True,
        'lang': str(lang) if lang is not None else None,
        'criteria': ['3.1.1'],
        'gevolg': 'afgekeurd' if lang is None else 'voldoet',
        'toelichting': (
            'Geen /Lang op de catalogus: de documenttaal is niet vastgelegd.'
            if lang is None else 'Documenttaal: %s' % lang
        ),
    }

    # --- titel ------------------------------------------------------------
    try:
        meta = pdf.open_metadata()
        titel = meta.get('dc:title')
    except Exception:
        titel = None
    if not titel:
        titel = (pdf.docinfo or {}).get('/Title')
        titel = str(titel) if titel else None
    vp = pdf.Root.get('/ViewerPreferences')
    toont_titel = bool(vp and vp.get('/DisplayDocTitle'))
    vast['titel'] = {
        'hard': True,
        'titel': titel,
        'displayDocTitle': toont_titel,
        'criteria': ['2.4.2'],
        'gevolg': 'afgekeurd' if not titel else ('voldoet' if toont_titel else 'titel staat er, maar wordt niet getoond'),
        'toelichting': (
            'Geen documenttitel in de eigenschappen.' if not titel
            else 'Titel: %r; DisplayDocTitle: %s' % (titel, toont_titel)
        ),
    }

    # --- reflow -----------------------------------------------------------
    vast['reflow'] = {
        'hard': True,
        'criteria': ['1.4.10'],
        'gevolg': 'niet_aanwezig',
        'toelichting': (
            'Een PDF heeft een vaste paginamaat en herschaalt niet mee; dit criterium '
            'gaat over inhoud die zich naar de vensterbreedte voegt.'
        ),
    }

    # --- tagstructuur -----------------------------------------------------
    st = pdf.Root.get('/StructTreeRoot')
    heeft_boom = st is not None and '/K' in st
    getagd = [i + 1 for i in range(doc.page_count)
              if '/StructParents' in doc.xref_object(doc[i].xref, compressed=False)]
    boom = _tagboom(doc) if heeft_boom else None

    vast['tagstructuur'] = {
        'hard': False,
        'soort': 'telling',
        'structTreeRootMetInhoud': heeft_boom,
        'paginasGetagd': len(getagd),
        'paginasTotaal': doc.page_count,
        'eersteOngetagdePagina': (
            next((p for p in range(1, doc.page_count + 1) if p not in set(getagd)), None)
        ),
        'elementtypes': (boom or {}).get('types'),
        'criteria': ['1.3.1', '1.3.2', '2.4.6'],
        'toelichting': (
            'Dit telt wat er staat. Of een tussenkopje een kop hád moeten zijn, en of de '
            'volgorde een lezer hindert, is een oordeel van de onderzoeker.'
        ),
    }

    # --- afbeeldingen -----------------------------------------------------
    fig = (boom or {}).get('figuren') or {}
    vast['afbeeldingen'] = {
        'hard': False,
        'soort': 'telling',
        'figureElementen': sum(fig.values()) if fig else 0,
        'zonderAlt': fig.get('zonder_alt', 0),
        'legeAlt': fig.get('lege_alt', 0),
        'metAlt': fig.get('met_alt', 0),
        'afbeeldingenOpPaginas': sum(len(doc[i].get_images()) for i in range(doc.page_count)),
        'criteria': ['1.1.1'],
        'toelichting': (
            'Ontbrekende alt is hard. Of een aanwezige alt deugt -- geen bestandsnaam, '
            'geen automatisch gegenereerde tekst -- moet je lezen.'
        ),
    }

    # --- koppelingen ------------------------------------------------------
    links, zonder_tekst = [], 0
    for i in range(doc.page_count):
        for l in doc[i].get_links():
            uri = l.get('uri')
            if not uri:
                continue
            tekst = doc[i].get_textbox(l['from']).strip()
            if not tekst:
                zonder_tekst += 1
            links.append({'pagina': i + 1, 'uri': uri, 'tekst': tekst[:80]})

    vast['koppelingen'] = {
        'hard': False,
        'soort': 'telling',
        'aantal': len(links),
        'zonderZichtbareTekst': zonder_tekst,
        'lijst': links[:40],
        'criteria': ['2.4.4'],
        'toelichting': (
            'Een link zonder zichtbare tekst is hard. Of "Stadsatlas" het doel duidelijk '
            'maakt, weegt de onderzoeker.'
        ),
    }

    # --- wat hier niet in zit ---------------------------------------------
    uit['nietTeMeten'] = {
        'criteria': ['1.3.3', '1.4.1', '1.4.5', '2.4.6', '3.1.2', '3.2.4'],
        'toelichting': (
            'Betekenisvragen: is kleur de enige drager, staat er tekst in een afbeelding, '
            'dekt de kop de lading, is dit woord een eigennaam, is de identificatie '
            'consistent. Die leest niemand uit het bestand.'
        ),
    }

    uit['let_op'] = [
        'Wat hier "hard" heet, is een uitputtende zoekactie: de verzameling manieren waarop '
        'een PDF dit kan doen is eindig en volledig afgelopen.',
        'Wat "telling" heet, is de helft van het antwoord. Het gebrek staat vast; de weging niet.',
    ]
    return uit


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'fout': 'gebruik: pdf-structuur.py <bestand.pdf> [--json]'}))
        raise SystemExit(1)
    try:
        print(json.dumps(meet(sys.argv[1]), ensure_ascii=False, indent=1))
    except Exception as e:
        print(json.dumps({'fout': str(e)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
