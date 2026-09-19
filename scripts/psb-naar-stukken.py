"""Een scrollopname van PAC's Screen reader preview in leesbare stukken snijden.

De Screen reader preview is het enige scherm dat laat zien wat een schermlezer
werkelijk voorleest: de tagboom op volgorde, met de lege alinea's, de figuren
zonder alternatieve tekst en de koppen die geen kop zijn. Er is geen export voor;
je legt hem vast met een scrollopname, en die levert een strook op van duizenden
beeldpunten hoog.

Zo'n strook is als geheel onbruikbaar. Het voorbeeld waarop dit is gebouwd was
1914 x 96207 beeldpunten en 118 MB -- te groot om op te slaan, te groot om te
bekijken, en te groot om aan een model te voeren. Gesneden in stukken van
schermhoogte is het 11 MB, en elk stuk is te lezen.

Twee dingen die niet vanzelf gaan:

1. `psd_tools` weigert een PSD of PSB boven 30.000 beeldpunten per as. Die grens
   zit in een controle vóór het decoderen en niet in het formaat zelf, dus lezen
   we het ruwe kanaal met `PSD.read` en stellen we per stuk zelf een beeld samen.
   Zo staat de hele strook ook nooit als één beeld in het geheugen.

2. De stukken krijgen overlap mee. Zonder overlap valt een regel die precies op
   de naad ligt in tweeën, en dan is op geen van beide stukken te lezen wat er
   staat.

Aanroepen:  python scripts/psb-naar-stukken.py <bron.psb> <uitvoermap> [hoogte] [overlap]
Uitvoer:    JSON op stdout met de gemaakte bestanden, zodat een route hem kan lezen.
"""
import json
import os
import sys

try:
    from psd_tools.psd import PSD
    from PIL import Image
except ImportError as e:  # pragma: no cover
    print(json.dumps({'fout': 'ontbrekende module: %s' % e}), flush=True)
    raise SystemExit(1)

HOOGTE_STANDAARD = 1400
OVERLAP_STANDAARD = 100


def snij(bron, uitmap, hoogte=HOOGTE_STANDAARD, overlap=OVERLAP_STANDAARD):
    os.makedirs(uitmap, exist_ok=True)

    with open(bron, 'rb') as fh:
        psd = PSD.read(fh)

    breedte = psd.header.width
    totaal_hoog = psd.header.height
    kanalen = psd.header.channels

    if psd.header.depth != 8:
        raise ValueError('alleen 8 bit per kanaal wordt ondersteund, dit is %d'
                         % psd.header.depth)

    data = psd.image_data.get_data(psd.header)
    if not data:
        raise ValueError('geen beeldgegevens in het bestand')

    stap = max(1, hoogte - overlap)
    stukken = []

    for n, boven in enumerate(range(0, totaal_hoog, stap), start=1):
        onder = min(boven + hoogte, totaal_hoog)

        vlakken = []
        for k in range(min(3, kanalen)):
            strook = data[k][boven * breedte:onder * breedte]
            vlakken.append(Image.frombytes('L', (breedte, onder - boven), strook))

        beeld = Image.merge('RGB', vlakken) if len(vlakken) == 3 else vlakken[0]

        naam = 'schermlezer-%03d.png' % n
        pad = os.path.join(uitmap, naam)
        beeld.save(pad, optimize=True)

        stukken.append({
            'bestand': naam,
            'vanaf': boven,
            'tot': onder,
            'bytes': os.path.getsize(pad),
        })

        if onder >= totaal_hoog:
            break

    return {
        'bron': os.path.basename(bron),
        'breedte': breedte,
        'hoogte': totaal_hoog,
        'stukhoogte': hoogte,
        'overlap': overlap,
        'stukken': stukken,
        'aantal': len(stukken),
        'bytesTotaal': sum(s['bytes'] for s in stukken),
    }


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'fout': 'gebruik: psb-naar-stukken.py <bron> <uitmap> [hoogte] [overlap]'}))
        raise SystemExit(1)

    bron, uitmap = sys.argv[1], sys.argv[2]
    hoogte = int(sys.argv[3]) if len(sys.argv) > 3 else HOOGTE_STANDAARD
    overlap = int(sys.argv[4]) if len(sys.argv) > 4 else OVERLAP_STANDAARD

    try:
        print(json.dumps(snij(bron, uitmap, hoogte, overlap), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'fout': str(e)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
