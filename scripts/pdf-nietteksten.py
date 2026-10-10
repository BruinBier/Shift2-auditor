#!/usr/bin/env python3
"""Contrast van niet-tekstuele onderdelen in een PDF meten: grafieken, diagrammen, pictogrammen.

Waarom dit bestaat
------------------
`pdf-contrast.py` meet tekst: de kleur van een letter tegen zijn achtergrond. SC 1.4.11 gaat
over iets anders -- of de delen van een grafiek, de symbolen in een legenda of een pictogram
zich genoeg onderscheiden van wat eromheen ligt. Daar bestond geen commando voor. Een agent
die het toch wilde weten, schreef er zelf een stukje code voor; de uitkomst kwam dan niet in
het logboek, de kaart toonde "niet gemeten", en niemand kon het herhalen. Zo ging het op
LEU-01 (Uitvoeringsplan mobiliteit, 2026-10-10): de kleuren van de cirkeldiagrammen op
pagina 71 klopten, maar stonden nergens als meting.

Hoe het meet
------------
1. Per pagina zoeken we de onderdelen op die eronder kunnen vallen: afbeeldingen (een
   grafiek staat vaak als plaatje in het document) en groepen tekeningen (een grafiek uit
   Word of Excel is vaak een verzameling gevulde vlakken).
2. Wat zeker niet eronder valt, slaan we over met de reden erbij: tabelranden, een gekleurd
   vlak achter tekst (dat is tekstcontrast, 1.4.3), en hele kleine dingen.
3. Een afbeelding die op veel pagina's op dezelfde plek terugkomt -- het logo in de kop --
   meten we één keer en melden we met de pagina's erbij.
4. Van elk onderdeel tellen we de kleuren op de beeldpunten. De achtergrond is de kleur die
   het meest voorkomt in de rand om het onderdeel. Elke kleur die een deel van het
   onderdeel vult, zetten we tegen die achtergrond; kleuren die direct tegen elkaar aan
   liggen, ook tegen elkaar.
5. Een foto heeft geen vlakke kleuren: dan geven we geen verhoudingen, alleen de melding.

Wat dit script NIET doet
------------------------
Oordelen. Of een kleur betekenis draagt -- een grafieksegment wel, een sierlijn niet -- en of
de informatie ook op een andere manier wordt gegeven (percentages bij de segmenten), beslist
de auditor met de uitsnede ernaast. Zie Shift2_Regels_SC_1_4_11.md.

Gebruik
-------
    python scripts/pdf-nietteksten.py <bestand.pdf> <voorvoegsel> [--paginas=71,74]

De uitsneden heten <voorvoegsel>-p71-1.png. Een voorvoegsel en geen map: de route die ze
op de kaart toont (/api/meting/artefact) levert alleen bestanden uit tmp/audit-cli zelf,
zonder submappen, en dat is een bewuste grens.
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict

try:
    import fitz  # PyMuPDF
    import numpy as np
except ImportError as e:
    print(json.dumps({"fout": f"Ontbrekende bibliotheek: {e}. Installeer PyMuPDF en numpy."}))
    sys.exit(1)

# Op welke resolutie we de onderdelen uitlezen. Hoog genoeg dat een dun segment niet
# wegvalt in de randen (antialiasing), laag genoeg dat een document van honderd pagina's
# binnen een minuut klaar is.
DPI = 150
# Kleiner dan dit (in punten, beide zijden) is geen grafiek of pictogram dat telt.
MIN_ZIJDE = 10
# Een kleur telt als vlakke kleur als hij minstens dit deel van het onderdeel vult. Lager
# en de randen van letters en de overgangen tussen vlakken komen als eigen kleur terug.
MIN_AANDEEL = 0.004
# Vullen de vlakke kleuren samen minder dan dit, dan is het een foto of een verloop.
MIN_VLAK_TOTAAL = 0.6
# Tinten die minder dan dit van elkaar verschillen (afstand in RGB) zijn één kleur.
SAMEN = 12
# Vanaf zoveel pagina's met dezelfde afbeelding op dezelfde plek is het een terugkerend
# onderdeel (logo in de kop, decoratie in de voettekst).
TERUGKEREND_VANAF = 3


def helderheid(rgb):
    def kanaal(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * kanaal(r) + 0.7152 * kanaal(g) + 0.0722 * kanaal(b)


def verhouding(a, b):
    la, lb = helderheid(a), helderheid(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def hexkleur(rgb):
    return "#%02X%02X%02X" % tuple(int(v) for v in rgb)


def tekstvlakken(pagina):
    rechthoeken = []
    for blok in pagina.get_text("dict")["blocks"]:
        for regel in blok.get("lines", []):
            for span in regel["spans"]:
                if span["text"].strip():
                    rechthoeken.append(fitz.Rect(span["bbox"]))
    return rechthoeken


def overlap(a, b):
    r = fitz.Rect(a) & fitz.Rect(b)
    return 0 if r.is_empty else r.get_area()


def soort_tekening(cluster, tekeningen, teksten):
    """Bepaal of een groep tekeningen een grafiek kan zijn, of iets wat er niet onder valt."""
    vlakken = [t for t in tekeningen if fitz.Rect(t["rect"]).intersects(cluster)]
    if not vlakken:
        return "leeg"
    dun = [t for t in vlakken
           if min(fitz.Rect(t["rect"]).width, fitz.Rect(t["rect"]).height) < 2.5]
    tekst_erin = [t for t in teksten if cluster.contains(t) or overlap(cluster, t) > 0.5 * t.get_area()]
    # Een raster van dunne lijnen met tekst ertussen is een tabel.
    if len(dun) >= 0.7 * len(vlakken) and len(tekst_erin) >= 4:
        return "tabelranden"
    # Eén groot vlak met tekst erop is een tekstkader: dat is tekstcontrast (1.4.3).
    groot = max(vlakken, key=lambda t: fitz.Rect(t["rect"]).get_area())
    if (len(vlakken) <= 3 and fitz.Rect(groot["rect"]).get_area() >= 0.8 * cluster.get_area()
            and tekst_erin):
        return "vlak achter tekst"
    # Ook als het kader uit een paar losse vlakken bestaat: weinig vulkleuren en een flink
    # deel van het gebied is tekst. Een grafiek heeft hooguit een legenda en asnamen, en die
    # dekken samen veel minder. Op LEU-01 pagina 73 telde een blauw tekstkader anders als
    # grafiek, met de zwarte tekst erop als "kleur".
    vulkleuren = {tuple(t["fill"]) for t in vlakken if t.get("fill")}
    tekstdekking = sum(overlap(cluster, t) for t in tekst_erin) / max(1.0, cluster.get_area())
    if len(vulkleuren) <= 3 and tekstdekking >= 0.2:
        return "vlak achter tekst"
    # Alleen dunne lijnen zonder vulling van betekenis: scheidingslijnen, onderstrepingen.
    if len(dun) == len(vlakken):
        return "lijnen"
    return "tekening"


def meet_gebied(pagina, rect):
    """Tel de kleuren in een gebied en zet ze tegen de achtergrond en tegen elkaar."""
    zoom = DPI / 72.0
    marge = 4  # punten rondom, om de achtergrond te kunnen zien
    ruim = fitz.Rect(rect.x0 - marge, rect.y0 - marge, rect.x1 + marge, rect.y1 + marge) & pagina.rect
    pix = pagina.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=ruim, alpha=False)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]

    # De achtergrond: de kleur die het meest voorkomt in de rand om het onderdeel.
    m = max(1, int(marge * zoom) - 1)
    rand = np.concatenate([
        img[:m].reshape(-1, 3), img[-m:].reshape(-1, 3),
        img[:, :m].reshape(-1, 3), img[:, -m:].reshape(-1, 3),
    ])
    # tolist(): gewone getallen, geen bytes. Met bytes loopt het verschil tussen twee
    # kleuren rond (5 - 250 wordt 11) en worden kleuren samengevoegd die niets op elkaar lijken.
    achtergrond = Counter(map(tuple, rand.tolist())).most_common(1)[0][0]

    binnen = img[m:-m or None, m:-m or None].reshape(-1, 3)
    totaal = len(binnen)
    if totaal == 0:
        return None
    telling = Counter(map(tuple, binnen.tolist()))
    # Bijna gelijke tinten samenvoegen. Een plaatje dat als JPEG is opgeslagen heeft geen
    # vlakke kleuren maar ruis eromheen: wit wordt #FEFEFE en #FDFDFD, en een kaart levert
    # tientallen grijzen die één vlak zijn. De meest voorkomende tint van een groep staat
    # voor de hele groep.
    vertegenwoordigers = []
    for k, n in telling.most_common(400):
        for v in vertegenwoordigers:
            if sum((x - y) ** 2 for x, y in zip(k, v[0])) <= SAMEN ** 2:
                v[1] += n
                break
        else:
            vertegenwoordigers.append([k, n])
    if vertegenwoordigers and sum((x - y) ** 2 for x, y in zip(vertegenwoordigers[0][0], achtergrond)) <= SAMEN ** 2:
        vertegenwoordigers[0][0] = achtergrond
    for v in vertegenwoordigers:
        if v[0] != achtergrond and sum((x - y) ** 2 for x, y in zip(v[0], achtergrond)) <= SAMEN ** 2:
            v[0] = achtergrond
    samen = Counter()
    for k, n in vertegenwoordigers:
        samen[k] += n
    vlak = [(k, n) for k, n in samen.most_common(40) if n / totaal >= MIN_AANDEEL]
    vlak_totaal = sum(n for _, n in vlak) / totaal
    if vlak_totaal < MIN_VLAK_TOTAAL:
        return {"fotoOfVerloop": True, "achtergrond": hexkleur(achtergrond),
                "vlakkeKleurenAandeel": round(vlak_totaal, 2)}

    kleuren = []
    for k, n in vlak:
        if k == achtergrond:
            continue
        kleuren.append({
            "kleur": hexkleur(k),
            "aandeel": round(n / totaal, 3),
            "tegenAchtergrond": round(verhouding(k, achtergrond), 2),
        })

    # Welke vlakke kleuren liggen direct tegen elkaar aan? Elk beeldpunt dat exact een
    # vlakke kleur heeft krijgt zijn nummer; daarna tellen we buren die verschillen.
    index = {k: i for i, (k, _) in enumerate(vlak)}
    vlakimg = img[m:-m or None, m:-m or None]
    h, w = vlakimg.shape[:2]
    nummers = np.full((h, w), -1, dtype=np.int64)
    pixels = vlakimg.astype(np.int64)
    for k, i in index.items():
        afstand = ((pixels - np.array(k, dtype=np.int64)) ** 2).sum(axis=2)
        nummers[(afstand <= SAMEN ** 2) & (nummers < 0)] = i
    paren = Counter()
    for a, b in ((nummers[:, :-1], nummers[:, 1:]), (nummers[:-1, :], nummers[1:, :])):
        geldig = (a >= 0) & (b >= 0) & (a != b)
        for x, y in zip(a[geldig].tolist(), b[geldig].tolist()):
            paren[(min(x, y), max(x, y))] += 1
    terug = {i: k for k, i in index.items()}
    buren = []
    for (x, y), n in paren.items():
        ka, kb = terug[x], terug[y]
        if achtergrond in (ka, kb) or n < 20:
            continue
        buren.append({"kleuren": [hexkleur(ka), hexkleur(kb)],
                      "verhouding": round(verhouding(ka, kb), 2)})
    buren.sort(key=lambda b: b["verhouding"])

    return {"fotoOfVerloop": False, "achtergrond": hexkleur(achtergrond),
            "kleuren": kleuren, "buren": buren, "pix": pix}


def meet_document(pad, voorvoegsel, paginas=None):
    doc = fitz.open(pad)
    totaal = doc.page_count
    te_doen = [p for p in (paginas or range(1, totaal + 1)) if 1 <= p <= totaal]
    os.makedirs(os.path.dirname(os.path.abspath(voorvoegsel)), exist_ok=True)

    # Eerst de afbeeldingen die op veel pagina's op dezelfde plek staan.
    plekken = defaultdict(list)
    for p in te_doen:
        for info in doc[p - 1].get_image_info(xrefs=True):
            r = fitz.Rect(info["bbox"])
            plekken[(info.get("xref"), round(r.x0), round(r.y0), round(r.width), round(r.height))].append(p)
    terugkerend = {k: v for k, v in plekken.items() if len(v) >= TERUGKEREND_VANAF}

    onderdelen = []
    overgeslagen = []
    al_gemeten = set()

    for p in te_doen:
        pagina = doc[p - 1]
        teksten = tekstvlakken(pagina)
        kandidaten = []
        for info in pagina.get_image_info(xrefs=True):
            r = fitz.Rect(info["bbox"]) & pagina.rect
            k = (info.get("xref"), round(fitz.Rect(info["bbox"]).x0), round(fitz.Rect(info["bbox"]).y0),
                 round(fitz.Rect(info["bbox"]).width), round(fitz.Rect(info["bbox"]).height))
            if k in terugkerend:
                if k in al_gemeten:
                    continue
                al_gemeten.add(k)
                kandidaten.append(("afbeelding", r, terugkerend[k]))
            else:
                kandidaten.append(("afbeelding", r, None))
        tekeningen = pagina.get_drawings()
        if tekeningen:
            for cluster in pagina.cluster_drawings(drawings=tekeningen):
                soort = soort_tekening(cluster, tekeningen, teksten)
                if soort != "tekening":
                    if soort != "leeg":
                        overgeslagen.append({"pagina": p, "soort": soort,
                                             "reden": {
                                                 "tabelranden": "lijnen van een tabel; geen grafiek",
                                                 "vlak achter tekst": "gekleurd vlak achter tekst; dat is tekstcontrast (1.4.3), niet 1.4.11",
                                                 "lijnen": "alleen dunne lijnen, zoals scheidingslijnen",
                                             }[soort]})
                    continue
                kandidaten.append(("tekening", cluster & pagina.rect, None))

        volgnummer = 0
        for soort, r, op_paginas in kandidaten:
            if r.is_empty or r.width < MIN_ZIJDE or r.height < MIN_ZIJDE:
                overgeslagen.append({"pagina": p, "soort": soort,
                                     "reden": f"kleiner dan {MIN_ZIJDE} punten"})
                continue
            if r.get_area() > 0.9 * pagina.rect.get_area():
                overgeslagen.append({"pagina": p, "soort": soort,
                                     "reden": "beslaat de hele pagina: achtergrond of scan"})
                continue
            meting = meet_gebied(pagina, r)
            if meting is None:
                continue
            volgnummer += 1
            uitsnede = f"{voorvoegsel}-p{p}-{volgnummer}.png"
            pix = meting.pop("pix", None)
            if pix is None:
                pix = pagina.get_pixmap(matrix=fitz.Matrix(DPI / 72.0, DPI / 72.0), clip=r)
            pix.save(uitsnede)
            onder = [k for k in meting.get("kleuren", []) if k["tegenAchtergrond"] < 3]
            onderdelen.append({
                "pagina": p,
                **({"terugkerendOpPaginas": op_paginas} if op_paginas else {}),
                "soort": soort,
                "plek": [round(v) for v in r],
                **meting,
                "kleurenOnder3": len(onder),
                "burenOnder3": len([b for b in meting.get("buren", []) if b["verhouding"] < 3]),
                "uitsnede": uitsnede,
            })

    return {
        "bestand": pad,
        "paginas": totaal,
        "paginasGemeten": len(te_doen),
        "onderdelenGemeten": len(onderdelen),
        "onderdelenMetKleurOnder3": len([o for o in onderdelen if o["kleurenOnder3"] or o["burenOnder3"]]),
        "fotoOfVerloop": len([o for o in onderdelen if o.get("fotoOfVerloop")]),
        "onderdelen": onderdelen,
        "overgeslagen_met_reden": overgeslagen,
    }


def main():
    p = argparse.ArgumentParser(description="Meet het contrast van grafieken en pictogrammen in een PDF.")
    p.add_argument("bestand")
    p.add_argument("voorvoegsel")
    p.add_argument("--paginas", help="Komma-gescheiden paginanummers, bijv. 71,74. Standaard: alle.")
    args = p.parse_args()
    paginas = None
    if args.paginas:
        paginas = [int(n) for n in args.paginas.split(",") if n.strip().isdigit()]
    print(json.dumps(meet_document(args.bestand, args.voorvoegsel, paginas), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
