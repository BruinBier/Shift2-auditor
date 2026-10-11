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
   onderdeel vult, zetten we tegen die achtergrond.
5. Heeft een vlak een rand -- een donkere omlijning om een lichte balk -- dan meten we die
   ook. Volgens W3C-techniek G209 telt een rand pas als hij 3:1 haalt met ELK van de twee
   kleuren die hij scheidt: de vulkleur en de achtergrond. Tot 2026-10-11 telde hier alleen
   rand tegen achtergrond, en kwam het turquoise op LEU-01 pagina 74 ten onrechte door:
   zijn rand haalt 4,15:1 tegen wit, maar 2,05:1 tegen het turquoise zelf.
6. Vlakken die binnen anderhalve punt van elkaar liggen zijn buren, ook met een dun lijntje
   ertussen. Die moeten van elkaar te onderscheiden zijn (W3C Understanding 1.4.11, het
   voorbeeld met de taartgrafiek; techniek G209): raken ze elkaar, dan onderling 3:1; ligt
   er een lijn tussen, dan elke kleur 3:1 tegen die lijn. Tot 2026-10-10 telden alleen vlakken die elkaar raakten, en daardoor
   zag het commando de buren in een cirkeldiagram met witte scheidingslijnen niet.
7. Een foto heeft geen vlakke kleuren: dan geven we geen verhoudingen, alleen de melding.

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

# Op welke resolutie we de onderdelen uitlezen. Een rand van een half punt is bij 150 dpi
# één vervaagd beeldpunt en verdwijnt dan in de overgang; bij 300 dpi is hij twee punten
# breed en heeft hij zijn eigen kleur. Op LEU-01 pagina 74 hadden de balken zo'n rand.
DPI = 300
# Kleiner dan dit (in punten, beide zijden) is geen grafiek of pictogram dat telt.
MIN_ZIJDE = 10
# Een kleur telt als vlakke kleur als hij minstens dit deel van het onderdeel vult. Lager
# en de randen van letters en de overgangen tussen vlakken komen als eigen kleur terug.
MIN_AANDEEL = 0.004
# Vullen de vlakke kleuren samen minder dan dit, dan is het een foto of een verloop.
MIN_VLAK_TOTAAL = 0.6
# Tinten die minder dan dit van elkaar verschillen (afstand in RGB) zijn één kleur.
SAMEN = 12
# Twee kleuren die minder dan dit (in punten) van elkaar liggen, zijn buren: ook als er een
# dun lijntje tussen zit, zoals de witte scheidingslijnen in een cirkeldiagram.
BUREN_BINNEN_PT = 1.5
# Hoe breed (in punten) de strook om een kleur is waarin we naar een rand zoeken.
RANDSTROOK_PT = 0.75
# Een rand telt als rand als hij minstens dit deel van die strook vult.
RAND_AANDEEL = 0.3
# Buren zoeken we alleen tussen de grootste vlakke kleuren; een illustratie met dertig
# tinten levert anders honderden paren op die niemand leest.
MAX_KLEUREN_VOOR_BUREN = 12
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


def verbreed(masker, r):
    """Een masker r beeldpunten oprekken in alle richtingen (vierkant), zonder scipy."""
    uit = masker.copy()
    for d in range(1, r + 1):
        uit[d:, :] |= masker[:-d, :]
        uit[:-d, :] |= masker[d:, :]
    tussen = uit.copy()
    for d in range(1, r + 1):
        uit[:, d:] |= tussen[:, :-d]
        uit[:, :-d] |= tussen[:, d:]
    return uit


def schuif(masker, r, dy, dx):
    """Punten die binnen r stappen in richting (dy, dx) een punt van het masker hebben."""
    uit = np.zeros_like(masker)
    h, w = masker.shape
    for d in range(1, r + 1):
        y, x = dy * d, dx * d
        bron = masker[max(0, y):h + min(0, y), max(0, x):w + min(0, x)]
        uit[max(0, -y):h + min(0, -y), max(0, -x):w + min(0, -x)] |= bron
    return uit


def tussen(a, b, r):
    """Punten die horizontaal of verticaal tussen masker a en masker b in liggen."""
    links_a, rechts_a = schuif(a, r, 0, -1), schuif(a, r, 0, 1)
    links_b, rechts_b = schuif(b, r, 0, -1), schuif(b, r, 0, 1)
    boven_a, onder_a = schuif(a, r, -1, 0), schuif(a, r, 1, 0)
    boven_b, onder_b = schuif(b, r, -1, 0), schuif(b, r, 1, 0)
    return ((links_a & rechts_b) | (links_b & rechts_a)
            | (boven_a & onder_b) | (boven_b & onder_a)) & ~a & ~b


def inpakken(pixels):
    """RGB-beeldpunten als één getal per punt, om snel te kunnen tellen."""
    p = pixels.astype(np.int64)
    return (p[..., 0] << 16) | (p[..., 1] << 8) | p[..., 2]


def uitpakken(sleutel):
    sleutel = int(sleutel)
    return ((sleutel >> 16) & 255, (sleutel >> 8) & 255, sleutel & 255)


def meest_voorkomend(pixels):
    if len(pixels) == 0:
        return None, 0
    sleutels, aantallen = np.unique(inpakken(pixels), return_counts=True)
    i = int(np.argmax(aantallen))
    return uitpakken(sleutels[i]), int(aantallen[i])


def dichtbij(img, kleur):
    afstand = ((img.astype(np.int64) - np.array(kleur, dtype=np.int64)) ** 2).sum(axis=-1)
    return afstand <= SAMEN ** 2


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
    achtergrond = meest_voorkomend(rand)[0]

    binnen = img[m:-m or None, m:-m or None].reshape(-1, 3)
    totaal = len(binnen)
    if totaal == 0:
        return None
    sleutels, aantallen = np.unique(inpakken(binnen), return_counts=True)
    volgorde = np.argsort(-aantallen)[:400]
    telling = Counter({uitpakken(sleutels[i]): int(aantallen[i]) for i in volgorde})
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

    vlakimg = img[m:-m or None, m:-m or None]
    bij_achtergrond = dichtbij(vlakimg, achtergrond)
    alle = [k for k, _ in vlak if k != achtergrond]
    maskers = {k: dichtbij(vlakimg, k) for k in alle[:MAX_KLEUREN_VOOR_BUREN * 2]}
    # Alleen MASSIEVE vlakken tellen als buur: een kleur die nog grotendeels overeind
    # blijft als je hem een half punt laat krimpen. Rasterlijnen, assen en de vervaagde
    # overgang tussen twee vlakken zijn dun en vallen dan weg. Zonder dit gaf de balk-
    # grafiek op LEU-01 pagina 74 tweeëntwintig "buren", vrijwel allemaal rasterlijnen.
    # Een tint die bijna gelijk is aan de achtergrond (minder dan 1,1:1) is het vlak van
    # de grafiek zelf, geen onderdeel; die doet ook niet mee.
    krimp = max(1, round(0.5 * zoom))
    massief = {}
    for k, mk in maskers.items():
        kern = ~verbreed(~mk, krimp)
        if kern.sum() >= 0.3 * mk.sum() and verhouding(k, achtergrond) >= 1.1:
            # Het vlak zelf, zonder de dunne lijnen in dezelfde tint: krimpen en weer
            # oprekken. Anders telt elke rasterlijn in balkgrijs mee als stuk balk, en ligt
            # de strook waarin we de rand zoeken over de hele grafiek.
            massief[k] = verbreed(kern, krimp) & mk
    eigen = list(massief)[:MAX_KLEUREN_VOOR_BUREN]
    # Wat geen rand kan zijn: de achtergrond en de massieve vlakken. Een dunne lijn wel.
    iets_vlaks = bij_achtergrond.copy()
    for k, mk in maskers.items():
        if k in massief or verhouding(k, achtergrond) < 1.1:
            iets_vlaks |= mk

    # De rand van een kleur: wat er in een smalle strook net buiten ligt, en geen
    # achtergrond en geen andere vlakke kleur is. Een balk met een donkere omlijning is
    # daardoor tegen de achtergrond wel te zien, ook als zijn vulkleur dat niet is; W3C
    # noemt die rand als oplossing (Understanding 1.4.11, het voorbeeld met de taartgrafiek).
    strook = max(1, round(RANDSTROOK_PT * zoom))
    for k in kleuren:
        kl = tuple(int(k["kleur"][i:i + 2], 16) for i in (1, 3, 5))
        mk = maskers.get(kl)
        if mk is None:
            continue
        if kl not in massief:
            continue
        mk = massief[kl]
        ring = verbreed(mk, strook) & ~mk
        n_ring = int(ring.sum())
        randpunten = ring & ~iets_vlaks
        # Of er een rand is, bepaalt het aandeel van de strook dat geen achtergrond en geen
        # vlak is; welke kleur hij heeft, de meest voorkomende daarvan. Een lijn van een half
        # punt is aan zijn randen vervaagd, dus één exacte kleur haalt de drempel zelden.
        # Een tint TUSSEN de vulkleur en de achtergrond in is de vervaagde overgang en geen
        # rand: zonder deze controle had elk segment een "rand" van bijna wit, en won bij de
        # grijze balk op pagina 74 een overgangsgrijs het van de echte donkere omlijning.
        l_eigen, l_achter = helderheid(kl), helderheid(achtergrond)
        laag, hoog = min(l_eigen, l_achter), max(l_eigen, l_achter)
        marge_l = 0.05 * (hoog - laag) + 0.005
        punten = vlakimg[randpunten]
        randkleur = None
        echte_randpunten = 0
        if len(punten):
            sleutels, aantallen = np.unique(inpakken(punten), return_counts=True)
            buiten = []
            for i in np.argsort(-aantallen):
                kleur = uitpakken(sleutels[i])
                lk = helderheid(kleur)
                if laag - marge_l <= lk <= hoog + marge_l:
                    continue
                buiten.append((kleur, int(aantallen[i])))
                echte_randpunten += int(aantallen[i])
            # Een lijn van een half punt komt in het beeld niet als één kleur uit maar als een
            # reeks tinten: op pagina 74 #848484, #949494, #797979 voor een lijn van #6B6B6B.
            # Daarom de tint waar het sterkste vijfde deel van de randpunten aan voldoet. Dat
            # is iets voorzichtiger dan de werkelijke lijnkleur, nooit strenger.
            if buiten:
                buiten.sort(key=lambda kn: -verhouding(kn[0], achtergrond))
                opgeteld = 0
                for kleur, n in buiten:
                    opgeteld += n
                    randkleur = kleur
                    if opgeteld >= 0.2 * echte_randpunten:
                        break
        if randkleur is not None and n_ring and echte_randpunten / n_ring >= RAND_AANDEEL / 2:
            k["rand"] = {"kleur": hexkleur(randkleur),
                         "tegenAchtergrond": round(verhouding(randkleur, achtergrond), 2),
                         "tegenVulkleur": round(verhouding(randkleur, kl), 2)}

    # Buren: kleuren die binnen BUREN_BINNEN_PT van elkaar liggen. Wat er tussen ligt is de
    # scheiding -- niets (ze raken elkaar), een witte lijn, een donkere lijn. Twee buren zijn
    # van elkaar te onderscheiden als ze onderling 3:1 halen, of als de scheiding tegen
    # allebei 3:1 haalt. Een witte lijn tussen geel en lichtblauw helpt dus niet: wit tegen
    # geel is 1,64:1.
    r = max(1, round(BUREN_BINNEN_PT * zoom))
    breed = {k: verbreed(massief[k], r) for k in eigen}
    buren = []
    for i, ka in enumerate(eigen):
        for kb in eigen[i + 1:]:
            contact = int((breed[ka] & massief[kb]).sum())
            if contact < 30:
                continue
            # Alleen wat echt tussen de twee in ligt. Een vierkante zone rond het raakpunt pakt
            # ook het vlak boven en onder twee balken mee, en dan werd de grafiekachtergrond de
            # "scheiding" in plaats van het lijntje ertussen.
            zone = tussen(massief[ka], massief[kb], r)
            n_zone = int(zone.sum())
            scheiding = None
            if n_zone >= 0.3 * contact:
                sk, _ = meest_voorkomend(vlakimg[zone])
                if sk is not None:
                    scheiding = {"kleur": hexkleur(sk),
                                 "tegen": [round(verhouding(sk, ka), 2), round(verhouding(sk, kb), 2)]}
            onderling = verhouding(ka, kb)
            # G209: meet elke kleur tegen de kleur ernaast, OF tegen de rand als die er is.
            # Ligt er een scheidingslijn tussen, dan is dat de grens die je ziet, en telt de
            # lijn tegen elk van de twee kleuren -- niet de twee kleuren tegen elkaar. Frits,
            # 2026-10-11, bij de witte lijnen in de cirkeldiagrammen van LEU-01 pagina 71.
            if scheiding is not None:
                onder3 = min(scheiding["tegen"]) < 3
            else:
                onder3 = onderling < 3
            buren.append({"kleuren": [hexkleur(ka), hexkleur(kb)],
                          "verhouding": round(onderling, 2),
                          "scheiding": scheiding,
                          "onder3": onder3})
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
            # Een kleur met een rand die 3:1 haalt, is tegen de achtergrond wel te zien.
            onder = [k for k in meting.get("kleuren", [])
                     if k["tegenAchtergrond"] < 3
                     and not (k.get("rand") and k["rand"]["tegenAchtergrond"] >= 3
                              and k["rand"]["tegenVulkleur"] >= 3)]
            onderdelen.append({
                "pagina": p,
                **({"terugkerendOpPaginas": op_paginas} if op_paginas else {}),
                "soort": soort,
                "plek": [round(v) for v in r],
                **meting,
                "kleurenOnder3": len(onder),
                "burenOnder3": len([b for b in meting.get("buren", []) if b["onder3"]]),
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
