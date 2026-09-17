#!/usr/bin/env python3
"""Contrast van tekst in een PDF meten, op de beeldpunten.

Waarom dit bestaat
------------------
Tot 2026-09-17 stond in de regels dat contrast in een PDF niet te meten viel en dat de
onderzoeker het met de hand deed. Dat klopte niet. Het gold voor de methode die toen voorlag --
raden welke beeldpunten tekst zijn op een gerenderde pagina -- maar niet voor de methode die
hier staat.

Het verschil zit in het combineren van twee bronnen:

1. De TEKST komt uit het document zelf. PyMuPDF geeft per tekstfragment de exacte kleur, de
   corpsgrootte, het lettertype en de plek op de pagina. Er valt dus niets te raden over welke
   beeldpunten tekst zijn en welke achtergrond: dat staat er gewoon.
2. De ACHTERGROND komt van de gerenderde pagina, op de beeldpunten. Dat moet wel, want een
   achtergrondkleur bestaat in een PDF niet als eigenschap. Tekst ligt op wit papier, op een
   gekleurd vlak, of -- en daar gaat het mis -- op een foto.

Op een foto of een verloop bestaat er geen enkele contrastverhouding: die loopt over de tekst
heen. Dit script geeft daarom een BAND, van het slechtste tot het beste punt, en toetst aan het
slechtste. Zie Shift2_Regels_SC_1_4_3.md.

Aanleiding: ZOET-01, Bijlage 2. Op pagina 38 staat lichtblauwe tekst (#00C4FF) op wit: 2,03:1
waar 4,5:1 nodig is. Op pagina 1 staan drie fotobijschriften over de foto's heen; die lopen van
1,26:1 tot 4,63:1. Een enkel getal zou daar allebei de keren het verkeerde beeld geven -- te
streng op de ene plek, te mild op de andere.

Gebruik
-------
    python scripts/pdf-contrast.py <bestand.pdf> [--paginas=1,38] [--json]

Zonder --paginas loopt hij het hele document af. De uitvoer is JSON als --json meegegeven
wordt, anders leesbare tekst.

Wat dit script NIET doet
------------------------
Oordelen. Het meet en rapporteert; of iets een bevinding is, beslist de auditor met de uitsnede
ernaast. Een tekst die over een foto loopt kan op het slechtste punt zakken terwijl hij als
geheel prima leesbaar is, en andersom. Keur nooit af op het getal alleen.
"""

import argparse
import json
import sys
from collections import Counter, defaultdict

try:
    import fitz  # PyMuPDF
    import numpy as np
except ImportError as e:
    print(json.dumps({"fout": f"Ontbrekende bibliotheek: {e}. Installeer PyMuPDF en numpy."}))
    sys.exit(1)


# Grote tekst mag 3:1 in plaats van 4,5:1. WCAG rekent in punten: 18pt, of 14pt vet.
GROOT_PT = 18.0
GROOT_VET_PT = 14.0

# Waarop we renderen. Bij 10pt tekst heb je de letterkern nodig, en die is bij een lagere
# zoom weggemiddeld tegen de achtergrond (antialiasing). 8x is ruim; hoger kost alleen tijd.
ZOOM = 8


def relatieve_helderheid(rgb):
    """WCAG 2.x relative luminance."""
    def kanaal(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * kanaal(r) + 0.7152 * kanaal(g) + 0.0722 * kanaal(b)


def verhouding(kleur_a, kleur_b):
    la, lb = relatieve_helderheid(kleur_a), relatieve_helderheid(kleur_b)
    hoog, laag = max(la, lb), min(la, lb)
    return (hoog + 0.05) / (laag + 0.05)


def is_grote_tekst(span):
    grootte = span.get("size", 0)
    vet = "bold" in (span.get("font") or "").lower()
    return grootte >= GROOT_PT or (vet and grootte >= GROOT_VET_PT)


def meet_span(span, img, zoom):
    """Meet één tekstfragment tegen zijn werkelijke achtergrond.

    De tekstkleur komt uit het DOCUMENT, niet uit het beeld: PyMuPDF geeft hem exact, en dan
    valt er niets te raden. Wat uit het beeld moet komen is de achtergrond, want die bestaat
    in een PDF niet als eigenschap.

    Per kolom zoeken we de beeldpunten die het dichtst bij de opgegeven tekstkleur liggen (de
    letterkern) en het punt dat daar het verst vanaf ligt (de achtergrond eromheen). Dat is
    wat een band oplevert: over een foto verschilt de achtergrond per letter, en het slechtste
    punt is wat telt.

    Kolommen zonder inkt slaan we over. Tussen twee letters staat alleen achtergrond, en die
    met zichzelf vergelijken gaf 1,00:1 -- wat er in een eerdere versie voor zorgde dat zwarte
    tekst op wit papier als onvoldoende uit de meting kwam.
    """
    kleur = span["color"]
    tekstkleur = np.array([(kleur >> 16) & 255, (kleur >> 8) & 255, kleur & 255], dtype=float)

    x0, y0, x1, y1 = [v * zoom for v in span["bbox"]]
    y0i, y1i = max(0, int(y0)), min(img.shape[0], int(y1))
    x0i, x1i = max(0, int(x0)), min(img.shape[1], int(x1))
    if y1i <= y0i or x1i <= x0i:
        return None

    uitsnede = img[y0i:y1i, x0i:x1i].astype(float)
    if uitsnede.size == 0:
        return None

    breedte = uitsnede.shape[1]
    # Ongeveer 40 monsters over de breedte: genoeg om een verloop te zien, niet zo veel dat
    # het traag wordt op een document van 166 pagina's.
    stap = max(1, breedte // 40)

    # Hoe dicht een beeldpunt bij de opgegeven tekstkleur moet liggen om als inkt te tellen.
    # Ruim genomen, want antialiasing verschuift de randen van een letter flink.
    INKT_AFSTAND = 60.0

    ratios = []
    for i in range(0, max(1, breedte - stap + 1), stap):
        kolom = uitsnede[:, i:i + stap].reshape(-1, 3)
        if len(kolom) < 2:
            continue
        afstand = np.linalg.norm(kolom - tekstkleur, axis=1)
        inkt_punten = afstand <= INKT_AFSTAND
        if not inkt_punten.any():
            continue  # geen letter in deze kolom, alleen achtergrond
        # De achtergrond is het punt dat het verst van de tekstkleur ligt.
        achter = kolom[int(np.argmax(afstand))]
        ratios.append(verhouding(tuple(tekstkleur), tuple(achter)))

    if not ratios:
        return None
    return min(ratios), max(ratios)


def achtergrond_is_vlak(span, img, zoom, drempel=0.55):
    """Ligt de tekst op een egale achtergrond, of op een foto/verloop?

    Dat bepaalt hoe je de uitkomst opschrijft: bij een vlakke achtergrond is één verhouding
    de waarheid, bij een foto is dat een band.

    De drempel ligt op 55% en niet hoger, omdat het bandje rondom de tekst ook de LETTERS
    zelf bevat. Bij 11pt tekst is dat al gauw een derde van de beeldpunten, en met een
    strenge drempel kwam wit papier daardoor als "foto of verloop" uit de meting.
    """
    x0, y0, x1, y1 = [v * zoom for v in span["bbox"]]
    marge = int(3 * zoom / 2)
    y0i, y1i = max(0, int(y0) - marge), min(img.shape[0], int(y1) + marge)
    x0i, x1i = max(0, int(x0) - marge), min(img.shape[1], int(x1) + marge)
    if y1i <= y0i or x1i <= x0i:
        return True, None

    rand = img[y0i:y1i, x0i:x1i].reshape(-1, 3)
    # Kwantiseren op stapjes van 8: een JPEG-achtergrond is nooit exact één kleur, maar de
    # ruis erop maakt hem nog geen foto.
    grof = (rand // 8) * 8
    telling = Counter(map(tuple, grof))
    meest, aantal = telling.most_common(1)[0]
    if (aantal / len(rand)) < drempel:
        return False, None
    # De echte kleur teruggeven, niet de gekwantiseerde: een bevinding noemt #FFFFFF en
    # niet #F8F8F8.
    exact = Counter(
        tuple(p) for p in rand
        if tuple((np.array(p) // 8) * 8) == meest
    ).most_common(1)[0][0]
    return True, exact


def meet_document(pad, paginas=None):
    doc = fitz.open(pad)
    totaal = doc.page_count
    te_doen = paginas if paginas else range(1, totaal + 1)

    onvoldoende = []
    gemeten = 0
    overgeslagen_geen_tekst = []
    leeg = []

    for nummer in te_doen:
        if nummer < 1 or nummer > totaal:
            continue
        pagina = doc[nummer - 1]

        spans = []
        for blok in pagina.get_text("dict")["blocks"]:
            for regel in blok.get("lines", []):
                for span in regel["spans"]:
                    if span["text"].strip():
                        spans.append(span)

        if not spans:
            # Geen tekstfragmenten. Dat kan twee heel verschillende dingen betekenen, en die
            # uit elkaar houden is de hele grap:
            #
            #   - een LEGE pagina: niets erop, niets te meten, en niets aan de hand. Een
            #     hoofdstukscheiding bijvoorbeeld.
            #   - een SCAN: de pagina is een foto van tekst. Daar staat wel degelijk tekst,
            #     maar niet als tekst; alleen daar is een schermafdruk met een contrastmeting
            #     van de onderzoeker nodig.
            #
            # In een eerdere versie werden beide "zonder tekstlaag" genoemd. Op ZOET-01
            # Bijlage 2 leverde dat twee pagina's op die volledig blanco waren, met het
            # verzoek om een afdruk die nergens over ging.
            afbeeldingen = pagina.get_images(full=True)
            tekeningen = pagina.get_drawings()
            if not afbeeldingen and not tekeningen:
                leeg.append(nummer)
            else:
                overgeslagen_geen_tekst.append(nummer)
            continue

        pix = pagina.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        )[:, :, :3]

        for span in spans:
            uitkomst = meet_span(span, img, ZOOM)
            if uitkomst is None:
                continue
            gemeten += 1
            slechtst, best = uitkomst
            eis = 3.0 if is_grote_tekst(span) else 4.5
            if slechtst >= eis:
                continue

            vlak, achtergrondkleur = achtergrond_is_vlak(span, img, ZOOM)
            kleur = span["color"]
            tekstkleur = ((kleur >> 16) & 255, (kleur >> 8) & 255, kleur & 255)

            onvoldoende.append({
                "pagina": nummer,
                "tekst": span["text"].strip()[:80],
                "corpsgrootte": round(span["size"], 1),
                "lettertype": span.get("font", ""),
                "groteTekst": is_grote_tekst(span),
                "eis": eis,
                "tekstkleur": "#%02X%02X%02X" % tekstkleur,
                "achtergrond": ("#%02X%02X%02X" % achtergrondkleur) if (vlak and achtergrondkleur) else None,
                "achtergrondVlak": vlak,
                "slechtste": round(slechtst, 2),
                "beste": round(best, 2),
                # Bij een vlakke achtergrond is één getal de waarheid; bij een foto of een
                # verloop bestaat dat getal niet en hoort de band in de bevinding.
                "formulering": (
                    f"{slechtst:.2f}:1"
                    if vlak else
                    f"loopt van {slechtst:.2f}:1 tot {best:.2f}:1"
                ),
            })

    return {
        "bestand": pad,
        "paginas": totaal,
        "paginasGemeten": len([p for p in te_doen if 1 <= p <= totaal]),
        "tekstfragmentenGemeten": gemeten,
        # Een scan: beeld zonder tekstlaag. Alleen hier is een afdruk van de onderzoeker nodig.
        "paginasZonderTekstlaag": overgeslagen_geen_tekst,
        # Blanco pagina's. Geen tekst, geen beeld, niets te meten en niets aan de hand.
        "paginasLeeg": leeg,
        "onvoldoende": onvoldoende,
    }


def bundel(onvoldoende):
    """Groepeer op oorzaak: dezelfde kleurcombinatie is één bevinding, geen twintig."""
    groepen = defaultdict(lambda: {"paginas": set(), "voorbeelden": [], "slechtste": 99.0, "beste": 0.0})
    for g in onvoldoende:
        sleutel = (g["tekstkleur"], g["achtergrond"] or "wisselend", g["corpsgrootte"])
        groep = groepen[sleutel]
        groep["paginas"].add(g["pagina"])
        groep["slechtste"] = min(groep["slechtste"], g["slechtste"])
        groep["beste"] = max(groep["beste"], g["beste"])
        groep["eis"] = g["eis"]
        groep["achtergrondVlak"] = g["achtergrondVlak"]
        if len(groep["voorbeelden"]) < 3:
            groep["voorbeelden"].append({"pagina": g["pagina"], "tekst": g["tekst"]})
    resultaat = []
    for (tekstkleur, achtergrond, grootte), g in groepen.items():
        resultaat.append({
            "tekstkleur": tekstkleur,
            "achtergrond": achtergrond,
            "achtergrondVlak": g["achtergrondVlak"],
            "corpsgrootte": grootte,
            "eis": g["eis"],
            "slechtste": round(g["slechtste"], 2),
            "beste": round(g["beste"], 2),
            "formulering": (
                f"{g['slechtste']:.2f}:1"
                if g["achtergrondVlak"] else
                f"loopt van {g['slechtste']:.2f}:1 tot {g['beste']:.2f}:1"
            ),
            "aantalPaginas": len(g["paginas"]),
            "paginas": sorted(g["paginas"]),
            "voorbeelden": g["voorbeelden"],
        })
    return sorted(resultaat, key=lambda r: (-r["aantalPaginas"], r["slechtste"]))


def main():
    p = argparse.ArgumentParser(description="Meet tekstcontrast in een PDF op de beeldpunten.")
    p.add_argument("bestand")
    p.add_argument("--paginas", help="Komma-gescheiden paginanummers, bijv. 1,38. Standaard: alle.")
    p.add_argument("--json", action="store_true", help="Uitvoer als JSON.")
    args = p.parse_args()

    paginas = None
    if args.paginas:
        paginas = [int(n) for n in args.paginas.split(",") if n.strip().isdigit()]

    uitkomst = meet_document(args.bestand, paginas)
    uitkomst["gebundeld"] = bundel(uitkomst["onvoldoende"])

    if args.json:
        print(json.dumps(uitkomst, ensure_ascii=False, indent=2))
        return

    print(f"{uitkomst['bestand']} - {uitkomst['paginas']} pagina's, "
          f"{uitkomst['tekstfragmentenGemeten']} tekstfragmenten gemeten")
    if uitkomst["paginasZonderTekstlaag"]:
        zt = uitkomst["paginasZonderTekstlaag"]
        print(f"\nLET OP: {len(zt)} pagina's met beeld maar zonder tekstlaag (scan): "
              f"{zt[:15]}{' ...' if len(zt) > 15 else ''}")
        print("  Daar staat tekst als foto. Dit commando kan die niet meten; vraag de")
        print("  onderzoeker om een schermafdruk met een contrastmeting als ze ertoe doen.")
    if uitkomst["paginasLeeg"]:
        lg = uitkomst["paginasLeeg"]
        print(f"\n{len(lg)} lege pagina's overgeslagen: {lg[:15]}"
              f"{' ...' if len(lg) > 15 else ''}  (geen tekst en geen beeld; niets aan de hand)")

    if not uitkomst["gebundeld"]:
        print("\nGeen tekst onder de contrasteis gevonden.")
        return

    print(f"\nONVOLDOENDE CONTRAST - {len(uitkomst['gebundeld'])} combinatie(s):\n")
    for g in uitkomst["gebundeld"]:
        achtergrond = g["achtergrond"] if g["achtergrondVlak"] else "een foto of verloop"
        print(f"  {g['tekstkleur']} op {achtergrond}, {g['corpsgrootte']}pt")
        print(f"     contrast {g['formulering']}   (eis {g['eis']}:1)")
        print(f"     {g['aantalPaginas']} pagina's: {g['paginas'][:12]}"
              f"{' ...' if len(g['paginas']) > 12 else ''}")
        for v in g["voorbeelden"]:
            print(f'     p{v["pagina"]}: "{v["tekst"][:60]}"')
        print()

    print("Keur niet af op het getal alleen: maak een uitsnede en leg die ernaast.")


if __name__ == "__main__":
    main()
